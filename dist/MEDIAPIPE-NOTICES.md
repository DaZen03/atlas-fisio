# Notices for the movement analysis page

The optional video analyzer loads MediaPipe Tasks Vision `@mediapipe/tasks-vision` version `1.1.1` from jsDelivr and the Pose Landmarker Lite model from Google's MediaPipe model storage.

- MediaPipe Tasks Vision is distributed under the Apache License 2.0: https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE
- The Pose Landmarker Lite `.task` model is stated to be Apache 2.0 in the MediaPipe maintainers' response: https://github.com/google-ai-edge/mediapipe/issues/6306
- Google AI Edge Pose Landmarker documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js
- The model and runtime are downloaded when the user starts analysis. No video is posted to the atlas server. MediaPipe's privacy notice says the API may send performance and utilization metrics to Google; the analysis page discloses this before loading the detector.

This notice covers the MediaPipe runtime and model only. Other assets in the atlas retain their own notices and licenses.
