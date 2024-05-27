/**
 * Can be used for state management.
 * Can be used for "modelSettings" document data on Firestore.
 * Can be used on modelSettingsTemp document data on Firestore.
 * Can be used on "uploadModel" API as request body.
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
  labelPath: string;
};

/**
 * Can be used on "BillingModel.tsx" for state management only.
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
  labelFile: null | File;
};

export const TempModelSettingsPlaceholder: TempModelSettings = {
  inputImageSizes: "64x64",
  modelEnvironment: "keras",
  modelExtension: "h5",
  modelFile: null,
  labelFile: null,
};
