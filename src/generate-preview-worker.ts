import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

async function generate_preview(canvas: OffscreenCanvas) {
  const preview_blob = await canvas.convertToBlob({
    quality: 1,
  });
  return URL.createObjectURL(preview_blob);
}

export type Data = {
  model_url: string;
  canvas: OffscreenCanvas;
  width: number;
  height: number;
};

self.onmessage = async (evt: MessageEvent<Data>) => {
  const { model_url, canvas, width, height } = evt.data;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#3a3a3a00");
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.z = 1;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(model_url, (e) => {
    const progress = (e.loaded / e.total) * 100;
    self.postMessage({ status: "pending", progress });
  });
  gltf.scene.rotateX(0.5);
  scene.add(gltf.scene);

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.render(scene, camera);

  const preview_url = await generate_preview(canvas);

  renderer.dispose();
  self.postMessage({ status: "completed", url: preview_url });
};
