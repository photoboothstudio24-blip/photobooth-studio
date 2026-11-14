export type CameraErrorKind = "unsupported" | "insecure" | "denied" | "not-found" | "in-use" | "unknown";
export type CameraError = { kind: CameraErrorKind; message: string };
export type Facing = "user" | "environment";

export const PHOTO_RATIO = 3 / 4; // width / height, shared by preview and capture

export function checkSupport(): CameraError | null {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext)
    return { kind: "insecure", message: "The camera needs a secure connection. Open this site over https:// (or localhost while developing)." };
  if (!navigator.mediaDevices?.getUserMedia)
    return { kind: "unsupported", message: "This browser cannot access the camera. Try the latest Chrome, Safari, Edge or Firefox." };
  return null;
}

export function mapError(e: unknown): CameraError {
  const name = e instanceof DOMException || e instanceof Error ? e.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return { kind: "denied", message: "Camera access was blocked. Allow the camera in your browser's site settings, then try again." };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return { kind: "not-found", message: "No camera was found on this device." };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { kind: "in-use", message: "The camera is busy. Close other apps or tabs using it, then try again." };
    default:
      return { kind: "unknown", message: "The camera could not start. Try again." };
  }
}

export function openStream(facing: Facing): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1280 } },
    audio: false,
  });
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

/** Centered crop of the source frame to the target ratio (same result as CSS object-fit: cover). */
export function cropRect(vw: number, vh: number, ratio: number) {
  if (vw / vh > ratio) {
    const sw = vh * ratio;
    return { sx: (vw - sw) / 2, sy: 0, sw, sh: vh };
  }
  const sh = vw / ratio;
  return { sx: 0, sy: (vh - sh) / 2, sw: vw, sh };
}

/** Draws the current frame to a canvas. If mirror is on the saved photo is flipped to match the preview. */
export function captureFrame(video: HTMLVideoElement, mirror: boolean): Promise<Blob> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return Promise.reject(new Error("no-frame"));
  const { sx, sy, sw, sh } = cropRect(vw, vh, PHOTO_RATIO);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("no-canvas"));
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no-blob"))), "image/jpeg", 0.92));
}

export type Shot = { id: number; url: string };
let shotCounter = 0;
export const nextShotId = () => ++shotCounter;
