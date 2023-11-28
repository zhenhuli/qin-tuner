<template>
  <div>
    <div class="meter">
      <div class="inner">
        <div class="gauge">
          <v-chart :option="option" autoresize></v-chart>
        </div>
      </div>
    </div>
    <div class="info">
      <div style="font-size: 24px;">
        <span style="margin-right: 0.5em; font-weight: 500;">{{ noteData.name }}</span>
        <span>{{ noteData.frequency }}</span>
        <sub v-if="noteData.frequency">hz</sub>
        <span v-if="!noteData.name && !noteData.frequency">--</span>
      </div>
    </div>
    <div class="qin">
      <div v-for="item in qinNotes" :key="item.name" class="qin-item" :class="{ 'qin-active': item.name === noteData.name && item.octave === noteData.octave }">
        <span style="margin-right: 0.5em; font-weight: 500;">{{ item.title }}</span>
        <span>{{ getQinFrequency(item.name, item.octave) }}</span>
        <sub>hz</sub>
      </div>
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 2em;
}

.container {
  padding: 30px;
}

.meter {
  position: relative;
  max-width: 400px;
  margin: 0 auto;
}
.meter .inner {
  padding-top: 100%;
}
.meter .gauge {
  position: absolute;
  inset: 0;
}

.info {
  margin: 0 auto;
  margin-top: 30px;
  width: fit-content;
  text-align: center;
}
.qin {
  margin: 0 auto;
  margin-top: 30px;
  max-width: 400px;
  display: flex;
  flex-wrap: wrap;
  gap: 1em;
  white-space: nowrap;
}
.qin .qin-item {
  border: 1px solid #eee;
  padding: 6px 6px 4px;
  border-radius: 4px;
  line-height: 1.2;
}
.qin .qin-active {
  color: red;
  border-color: red;
}
</style>

<script setup>
import { onMounted, reactive } from 'vue'

import PitchFinder from 'pitchfinder'

import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { GridComponent } from 'echarts/components';
import { GaugeChart } from 'echarts/charts';
import VChart from 'vue-echarts';

use([
  GridComponent,
  CanvasRenderer,
  GaugeChart,
]);

let noteData = reactive({
  name: '',
  octave: '',
  standardFrequency: '',
  frequency: '',
});

const option = reactive({
  grid: {
    x: 0,
    y: 0,
    x2: 0,
    y2: 0,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    containLabel: false,
  },
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '75%'],
      radius: '90%',
      min: -25,
      max: 25,
      splitNumber: 10,
      axisLine: {
        lineStyle: {
          width: 0,
          color: [
            // [0.3, '#FF6E76'],
            // [0.7, '#7CFFB2'],
            // [1, '#FF6E76'],
            [1, '#000'],
          ]
        }
      },
      axisTick: {
        length: 12,
        lineStyle: {
          color: 'auto',
          width: 2
        }
      },
      splitLine: {
        length: 20,
        lineStyle: {
          color: 'auto',
          width: 2
        }
      },
      detail: {
        formatter: () => '',
      },
      data: [
        {
          value: 0,
          // name: 'Grade Rating'
        }
      ]
    }
  ]
});

const C2 = 65.41;
const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const qinNotes = [
  {
    title: '一弦',
    value: 'C2',
    name: 'C',
    octave: 2,
  },
  {
    title: '二弦',
    value: 'D2',
    name: 'D',
    octave: 2,
  },
  {
    title: '三弦',
    value: 'F2',
    name: 'F',
    octave: 2,
  },
  {
    title: '四弦',
    value: 'G2',
    name: 'G',
    octave: 2,
  },
  {
    title: '五弦',
    value: 'A2',
    name: 'A',
    octave: 2,
  },
  {
    title: '六弦',
    value: 'C3',
    name: 'C',
    octave: 3,
  },
  {
    title: '七弦',
    value: 'D3',
    name: 'D',
    octave: 3,
  }
];

const getQinFrequency = (name, octave) => {
  return getNoteFrequency(notes.findIndex(n => n === name) + (octave - 2) * 12).toFixed(2) / 1;
}

const getNoteFrequency = (note) => {
  return Math.pow(2, note / 12) * C2;
}

const getNoteInfo = (frequency) => {
  const note = Math.round(12 * (Math.log(frequency / C2) / Math.log(2)))
  const nameIndex = note % 12;
  const name = notes[nameIndex > 0 ? nameIndex : 12 + nameIndex];
  const octave = Math.floor(note / 12) + 2;
  const standardFrequency = getNoteFrequency(note);
  const difference = frequency - standardFrequency
  return {
    name,
    octave,
    frequency: frequency.toFixed(2) / 1,
    standardFrequency: standardFrequency.toFixed(2) / 1,
    difference,
  }
}

const start = () => {
  function concatenate(resultConstructor, ...arrays) {
    let totalLength = 0;
    for (let arr of arrays) {
      totalLength += arr.length;
    }
    let result = new resultConstructor(totalLength);
    let offset = 0;
    for (let arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const processor = context.createScriptProcessor()

      const detectPitch = PitchFinder.AMDF({
        sampleRate: context.sampleRate,
      });

      source.connect(processor)
      processor.connect(context.destination)

      let recording = true;
      let buffer = new Float32Array();
      const sampleLengthMilliseconds = 100;
      processor.onaudioprocess = e => {
        if (!recording) return;
        buffer = concatenate(Float32Array, buffer, e.inputBuffer.getChannelData(0));
        if (buffer.length > context.sampleRate * sampleLengthMilliseconds / 1000) {
          recording = false;
          const frequency = detectPitch(buffer);
          if (frequency) {
            const data = getNoteInfo(frequency);
            Object.keys(noteData).forEach(key => {
              noteData[key] = data[key];
            })
            option.series[0].data[0].value = data.standardFrequency - data.frequency || 0;
          }
          buffer = new Float32Array();
          setTimeout(() => { recording = true; }, 250);
        }
      }
    })
    .catch(e => {
      alert('麦克风授权失败');
    })
}

onMounted(() => {
  start();
});
</script>
