/**
 * Can be used in both for state and server.
 */
export type ModelSettings = {
  inputImageSizes:
    | "64x64"
    | "120x120"
    | "224x224"
    | "299x299"
    | "331x331"
    | "512x512";
  modelEnvironment: "tensorflow" | "pytorch" | "keras";
  modelExtension: "h5" | "tflite" | "pb" | "pt" | "pth" | "onxx";
  modelPath: string;
};
