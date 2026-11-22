# 素材与第三方组件

- `dist/assets/mediapipe/vision_bundle.mjs` 与 `wasm/`：Google MediaPipe Tasks Vision 0.10.21，npm 包 `@mediapipe/tasks-vision`，其发布元数据声明为 Apache-2.0。许可证副本见 `licenses/Apache-2.0.txt`。上游项目：https://github.com/google-ai-edge/mediapipe 。打包版本未修改第三方代码。
- `dist/assets/mediapipe/hand_landmarker.task`：Google MediaPipe Hand Landmarker float16 模型，源地址：https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task 。模型说明：https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker 。
- `dist/assets/jasmine-garden.png`：在本项目制作过程中使用 imagegen 生成，提示词保存在 `docs/garden-prompt.txt`。
- `dist/assets/jasmine-rain-80s.m4a`：由用户提供的《茉莉雨》素材裁剪为前 80 秒。音乐权利归相应权利人，第三方代码的许可证不授予该音乐的使用权。

本项目未为原创项目代码指定开源许可证；第三方组件遵循各自许可证。
