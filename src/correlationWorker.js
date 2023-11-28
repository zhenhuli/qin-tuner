
import PitchFinder from 'pitchfinder'
  
self.addEventListener('message', (e) => {
  const {
    buffer,
    sampleRate,
  } = e.data;
  const detectPitch = PitchFinder.AMDF({
    sampleRate: sampleRate,
    minFrequency: 10,
  });
  const frequency = detectPitch(buffer);
  self.postMessage({ frequency })
})
