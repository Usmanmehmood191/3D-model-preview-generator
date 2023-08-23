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

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 3);
  scene.add(ambientLight);

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.z = 2;

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(model_url, (e) => {
    const progress = (e.loaded / e.total) * 100;
    self.postMessage({ status: "pending", progress });
  });
  scene.add(gltf.scene);

  // Fit camera to object's bounding box
  fitCameraToObject(camera, gltf.scene);

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.render(scene, camera);

  const preview_url = await generate_preview(canvas);

  renderer.dispose();
  self.postMessage({ status: "completed", url: preview_url });
};
function fitCameraToObject(camera:THREE.PerspectiveCamera, object:THREE.Group, offset = 1.0) {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * offset;

  const direction = camera.position.clone().sub(center).normalize();
  const newCameraPos = direction.multiplyScalar(distance).add(center);

  camera.position.copy(newCameraPos);
  camera.position.copy( camera.position.clone().add(new THREE.Vector3(distance/3, distance/3, 0)));
  camera.lookAt(center);
   // Calculate rotation to face camera
   const cameraPosition = new THREE.Vector3();
   camera.getWorldPosition(cameraPosition);
   cameraPosition.y = 0;
   cameraPosition.x = -1;
   cameraPosition.z = 0;

   object.lookAt(cameraPosition);
}