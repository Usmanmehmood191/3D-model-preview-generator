import { type Data } from "./generate-preview-worker";
import GeneratePreviewWorker from "./generate-preview-worker?worker";

const preview = document.getElementById("preview") as HTMLImageElement;
const form = document.getElementById("model-preview-form") as HTMLFormElement;
const feedback = document.getElementById("feedback") as HTMLParagraphElement;

type WorkerResponse =
  | { status: "pending"; progress: number }
  | { status: "completed"; url: string };

const generate_preview_worker = new GeneratePreviewWorker();

generate_preview_worker.onmessage = (evt: MessageEvent<WorkerResponse>) => {
  const { status } = evt.data;

  if (status === "completed") {
    feedback.innerText = "";
    preview.src = evt.data.url;
    // const a = document.createElement("a");
    // a.href = evt.data.url;
    // a.download = "model_preview";
    // a.click();
  }

  if (status === "pending") {
    feedback.innerText = `Generating ${evt.data.progress.toFixed(2)}%...`;
  }
};

form.addEventListener("submit", async function (evt) {
  evt.preventDefault();
  const data = new FormData(evt.target as HTMLFormElement);
  const model_url = data.get("model-url");

  if (!model_url) return;

  const W = 500; // window.innerWidth;
  const H = 500; // window.innerHeight;

  const canvas = document.createElement("canvas").transferControlToOffscreen();
  canvas.width = W;
  canvas.height = H;

  generate_preview_worker.postMessage(
    {
      model_url: model_url.toString(),
      canvas,
      width: W,
      height: H,
    } satisfies Data,
    [canvas]
  );
});
