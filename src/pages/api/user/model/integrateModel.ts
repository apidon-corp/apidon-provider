import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";
import { Post } from "@/types/Classification";
import { ModelSettings, ModelSettingsServer } from "@/types/Model";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { inputImageSizes, modelEnvironment, modelExtension, modelPath } =
    req.body as ModelSettings;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!inputImageSizes || !modelEnvironment || !modelExtension || !modelPath)
    return res.status(422).send("Invalid Prop or Props");

  /**
   * Creating API endpoint for this model.
   */
  let modelAPIEndpoint = "https://k.api.apidon.com/classify/tfclassify";
  try {
  } catch (error) {}

  /**
   * Updating Firestore modelSettings/modelSettings doc.
   */
  let modelSettingsServer: ModelSettingsServer = {
    inputImageSizes: inputImageSizes,
    modelAPIEndpoint: modelAPIEndpoint,
    modelEnvironment: modelEnvironment,
    modelExtension: modelExtension,
    modelPath: modelPath,
  };
  try {
    await firestore
      .doc(`/users/${operationFromUsername}/modelSettings/modelSettings`)
      .set({ ...modelSettingsServer });
  } catch (error) {
    console.error("Error on updating model settings doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  /**
   * Getting postsArray and their image URL's.
   */

  // Getting postsArray from posts/posts doc.
  let postsArray;
  try {
    const postsDoc = await firestore.doc("posts/posts").get();

    if (!postsDoc.exists) {
      console.error("posts/posts doc doesn't exists in provider database.");
      return res.status(500).send("Internal Server Error");
    }

    const postsDocData = postsDoc.data();

    if (postsDocData === undefined) {
      console.error("posts/posts doc data is undefined.");
      return res.status(500).send("Internal Server Error");
    }

    const postsArrayFetched = postsDocData.postsArray as Post[];

    if (!postsArray || postsArray === undefined) {
      console.error("postsArray is undefined or null.");
      return res.status(500).send("Internal Server Error");
    }

    postsArray = postsArrayFetched;
  } catch (error) {
    console.error("Error on getting postsArray array: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  /**
   * Getting image urls of these postDocPaths.
   * And creates new array with postDocPath and its image_url.
   */

  let getImageURLOfPostPromisesArray: Promise<
    | false
    | {
        postDocPath: string;
        image_url: any;
      }
  >[] = [];
  for (const postObject of postsArray) {
    const postDocPath = postObject.postDocPath;
    getImageURLOfPostPromisesArray.push(getImageURLOfPost(postDocPath));
  }

  const getImageURLOfPostPromisesArrayResults = await Promise.all(
    getImageURLOfPostPromisesArray
  );

  const postDocPathAndImageURLsArray: {
    postDocPath: string;
    image_url: string;
  }[] = [];

  for (const getImageURLOfPostResult of getImageURLOfPostPromisesArrayResults) {
    if (!getImageURLOfPostResult) {
      // Here means operation for that image failed.
      continue;
    }

    if (getImageURLOfPostResult.image_url === "0") {
      // Here means post doesn't exist anymore
      continue;
    }

    if (getImageURLOfPostResult.image_url === "1") {
      // Here means post exists but it has no image in it.
      continue;
    }

    // Here means we have a valid image_url.
    // We need to create a new array with postDocPath and image url
    postDocPathAndImageURLsArray.push({
      postDocPath: getImageURLOfPostResult.postDocPath,
      image_url: getImageURLOfPostResult.image_url,
    });
  }

  /** Classification Part
   * Now, we need to classify each image then creates new with predictions and postDocPath.
   */
}

const getImageURLOfPost = async (postDocPath: string) => {
  const providePostInformationEndpoint =
    process.env.PROVIDE_POST_INFORMATION_ENDPOINT;

  if (
    !providePostInformationEndpoint ||
    providePostInformationEndpoint === undefined
  ) {
    console.error(
      "Provide Post Information Endpoint couldn't be fetched from .env file."
    );
    return false;
  }

  const apiKeyBetweenServices = process.env.API_KEY_BETWEEN_SERVICES;

  if (apiKeyBetweenServices === undefined) {
    console.error(
      "API key between services couldn't be fetched from .env file."
    );
    return false;
  }

  try {
    const response = await fetch(providePostInformationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: apiKeyBetweenServices,
      },
      body: JSON.stringify({
        postDocPath: postDocPath,
      }),
    });

    if (!response.ok) {
      console.error(
        "Response from 'providePostInformation' API is not okay: \n",
        await response.text()
      );
      return false;
    }

    const result = await response.json();
    const image_url = result.image_url;

    return {
      postDocPath: postDocPath,
      image_url: image_url,
    };
  } catch (error) {
    console.error("Error on fetching to 'providePostInformation': \n", error);
    return false;
  }
};
