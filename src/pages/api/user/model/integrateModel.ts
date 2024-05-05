import getDisplayName from "@/apiUtils";
import { bucket, firestore } from "@/firebase/adminApp";
import { Post, PostThemeObject } from "@/types/Classification";
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

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  // Updating integration status on bill doc...
  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${operationFromUsername}/bills`)
      .where("active", "==", true)
      .get();
    if (activeBillDocCollection.empty)
      throw new Error("There is no active bill doc.");
    if (activeBillDocCollection.docs.length !== 1)
      throw new Error("There are more then one active bill doc.");
  } catch (error) {
    console.error("Error on getting active bill doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  const activeBillDoc = activeBillDocCollection.docs[0];
  try {
    await activeBillDoc.ref.update({
      integrationStarted: true,
    });
  } catch (error) {
    console.error(
      "Error on updatimg 'activeBill' doc while changing 'integrationStarted' field: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  /**
   * Getting temp data for integration.
   */
  let tempModelSettingsData: ModelSettings;
  try {
    const modelSettingsTempSnapshot = await firestore
      .doc(`users/${operationFromUsername}/modelSettings/modelSettingsTemp`)
      .get();
    if (!modelSettingsTempSnapshot.exists) {
      console.error(
        "modelSettingsTemp doc doesn't exists in provider database."
      );
      return res.status(500).send("Internal Server Error");
    }

    const modelSettingsData = modelSettingsTempSnapshot.data();
    if (modelSettingsData === undefined) {
      console.error("modelSettingsTemp doc data is undefined.");
      return res.status(500).send("Internal Server Error");
    }
    tempModelSettingsData = modelSettingsData as ModelSettings;
  } catch (error) {
    console.error("Error on getting modelSettingsTemp doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  /**
   * Change location of temp file with real file.
   */
  let modelFileURL;
  try {
    const tempFile = bucket.file(
      `users/${operationFromUsername}/model/temp/model.${tempModelSettingsData.modelExtension}`
    );
    await tempFile.move(
      `users/${operationFromUsername}/model/model.${tempModelSettingsData.modelExtension}`
    );

    const movedFile = bucket.file(
      `users/${operationFromUsername}/model/model.${tempModelSettingsData.modelExtension}`
    );
    await movedFile.makePublic();
    modelFileURL = movedFile.publicUrl();
  } catch (error) {
    console.error(
      "Error on moving temp model and creating new link for that file: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  /**
   * Creating API endpoint for this model with new moved file.
   */
  let modelAPIEndpoint = process.env.PROVIDER_ONE_API_ENDPOINT as string;
  try {
  } catch (error) {}

  /**
   * Updating Firestore modelSettings/modelSettings doc.
   */
  let modelSettingsServer: ModelSettingsServer = {
    inputImageSizes: tempModelSettingsData.inputImageSizes,
    modelAPIEndpoint: modelAPIEndpoint,
    modelEnvironment: tempModelSettingsData.modelEnvironment,
    modelExtension: tempModelSettingsData.modelExtension,
    modelPath: modelFileURL,
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

    if (!postsArrayFetched || postsArrayFetched === undefined) {
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

  // Creating promises array for classifying posts.
  const classifyPostsPromisesArray: Promise<false | PostThemeObject>[] = [];

  const apiKey = process.env.PYTHON_CLASSIFICATION_MODEL_API_KEY;
  if (!apiKey) {
    console.error("API key to access classification model is invalid.");
    return res.status(500).send("Internal Server Error");
  }

  const postThemesArray: PostThemeObject[] = [];
  for (const postDocPathAndImageURL of postDocPathAndImageURLsArray) {
    const classifyResult = await classifyPosts(
      postDocPathAndImageURL.postDocPath,
      postDocPathAndImageURL.image_url,
      modelAPIEndpoint,
      apiKey
    );

    if (!classifyResult) {
      continue;
    }
    
    // Preparing postThemes/postThemes's postThemesArray array.
    postThemesArray.push(classifyResult);
  }

  // Update postThemes/postThemes's postThemes array.
  try {
    await firestore
      .doc(`/users/${operationFromUsername}/postThemes/postThemes`)
      .set({
        postThemesArray: [...postThemesArray],
      });
  } catch (error) {
    console.error("Error on updating postThemesArray on firestore: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  // Update status of bill doc...
  try {
    await activeBillDoc.ref.update({
      active: false,
    });
  } catch (error) {
    console.error(
      "Error on updating 'activeBill' doc while changing 'active' field to 'false': \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  // Delete temp model settings doc
  try {
    await firestore
      .doc(`/users/${operationFromUsername}/modelSettings/modelSettingsTemp`)
      .delete();
  } catch (error) {
    console.error("Error on deleting temp model settings doc.");
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Suceess.");
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

/**
 * Classifiy posts and creates a valid postThemeObject.
 * @param postDocPath
 * @param image_url
 * @param classifyEndpoint
 * @param apiKey
 * @returns
 */
const classifyPosts = async (
  postDocPath: string,
  image_url: string,
  classifyEndpoint: string,
  apiKey: string
) => {
  try {
    const response = await fetch(classifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        APIKEY: apiKey,
      },
      body: JSON.stringify({
        image_url: image_url,
      }),
    });

    if (!response.ok) {
      console.error(
        "Response from classify image API of provider is not okay:: \n",
        await response.text()
      );
      return false;
    }

    const result = await response.json();
    const predictions = result["Combined Predictions"] as {
      label: string;
      score: number;
    }[];

    const themes: string[] = [];

    predictions.forEach((a, i) => {
      themes.push(a.label);
    });

    const postThemeObject: PostThemeObject = {
      postDocPath: postDocPath,
      themes: themes,
      ts: Date.now(),
    };

    return postThemeObject;
  } catch (error) {
    console.error("Error on classifiying post: \n", error);
    return false;
  }
};
