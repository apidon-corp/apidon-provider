/**
 * Can be used for both state and integrate API request body.
 * Also can be used on modelSettingsTemp doc on Firestore.
 * Also can be used for uploadModel API for body.
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

/**
 * Can be used in firestore modelSettings/modelSettings doc.
 */
export type ModelSettingsServer = {
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
  modelAPIEndpoint: string;
};

/**
 * Can be used for state management on uploading model.
 */
export type TempModelSettings = {
  inputImageSizes:
    | "64x64"
    | "120x120"
    | "224x224"
    | "299x299"
    | "331x331"
    | "512x512";
  modelEnvironment: "tensorflow" | "pytorch" | "keras";
  modelExtension: "h5" | "tflite" | "pb" | "pt" | "pth" | "onxx";
  modelFile: null | File;
};

export const TempModelSettingsPlaceholder: TempModelSettings = {
  inputImageSizes: "64x64",
  modelEnvironment: "keras",
  modelExtension: "h5",
  modelFile: null,
};
