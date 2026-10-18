const VERSION = '1.1.1';
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
let detector;

self.onmessage = async event => {
  const {type, bitmap, timestamp} = event.data || {};
  try {
    if (type === 'init') {
      const {FilesetResolver, PoseLandmarker} = await import(`${CDN}/vision_bundle.mjs`);
      const vision = await FilesetResolver.forVisionTasks(`${CDN}/wasm`);
      detector = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {modelAssetPath: MODEL},
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false
      });
      self.postMessage({type:'ready'});
      return;
    }
    if (type === 'estimate') {
      if (!detector) throw new Error('El detector aún no está preparado.');
      try {
        const result = detector.detectForVideo(bitmap, timestamp);
        self.postMessage({
          type:'pose', timestamp,
          landmarks: result.landmarks?.[0] || null,
          worldLandmarks: result.worldLandmarks?.[0] || null
        });
      } finally { bitmap?.close?.(); }
      return;
    }
    if (type === 'close') { detector?.close(); detector = null; }
  } catch (error) {
    bitmap?.close?.();
    self.postMessage({type:'error', message:String(error?.message || error)});
  }
};
