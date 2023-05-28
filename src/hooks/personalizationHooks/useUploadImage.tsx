import { auth } from "@/Firebase/clientApp";

export default function useUploadProfilePhoto() {
  /**
   *
   * @param image
   * @returns new profile photo image if op is successfull, otherwise an empty string.
   */
  const handleUploadImage = async (image: string) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error while image uploading. Couln't be got idToken",
        error
      );
      return "";
    }

    let response;
    try {
      response = await fetch("/api/user/imageUpload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ image: image }),
      });
    } catch (error) {
      console.error("Error while fetching imageUpload API", error);
      return "";
    }

    if (!response.ok) {
      console.error(
        "Error while uplaoding image. Error from api",
        await response.text()
      );
      return "";
    }

    const result = await response.json();
    const { newImageURL } = result;

    return newImageURL as string;
  };

  return {
    handleUploadImage,
  };
}
