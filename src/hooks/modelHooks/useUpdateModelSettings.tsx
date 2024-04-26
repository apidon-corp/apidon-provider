import { auth } from "@/firebase/clientApp";
import { ModelSettings } from "@/types/Model";

export default function useUpdateModelSettings() {
  const updateModelSettings = async (modelSettings: ModelSettings) => {
    let idToken;
    try {
      idToken = (await auth.currentUser?.getIdToken())?.toString();
    } catch (error) {
      console.error(
        "Error on model settings update: Couldn't be got idToken",
        error
      );
      return false;
    }

    try {
      const response = await fetch("/api/user/modelChange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          modelSettings: modelSettings,
        }),
      });

      if (!response.ok)
        throw new Error(
          `Response from 'modelChange' API is NOT ok. Here is the response from API: ${await response.text()}`
        );
      return true;
    } catch (error) {
      console.error("Error on model settings update: ", error);
      return false;
    }
  };

  return { updateModelSettings };
}
