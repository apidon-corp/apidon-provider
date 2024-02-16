import { auth, ref, storage } from "@/Firebase/clientApp";
import { ModelOptions } from "firebase-admin/lib/machine-learning/machine-learning-api-client";
import { getDownloadURL, uploadBytes } from "firebase/storage";

export default function useUploadModel() {
  const uploadModel = async (modelFile: File, extension: string) => {
    if (!auth.currentUser) {
      console.warn("Error on model upload: No users found.");
      return false;
    }

    const displayName = auth.currentUser.displayName;

    if (!displayName) {
      console.warn("Error on model upload: No display name found.");
      return false;
    }

    try {
      const storageRef = ref(
        storage,
        `users/${displayName}/model/model.${extension}`
      );
      await uploadBytes(storageRef, modelFile);

      const modelPathInServer = await getDownloadURL(storageRef);

      if (!modelPathInServer)
        throw new Error("Error on model upload: Model path is null.");

      return modelPathInServer;
    } catch (error) {
      console.error("Error on model upload while 'uploadBytes': ", error);
      return false;
    }
  };

  return { uploadModel };
}
