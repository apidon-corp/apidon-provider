import { fieldValue, firestore } from "@/firebase/adminApp";
import {
  Post,
  PostPredictionObject,
  PostThemeObject,
  ThemeObject,
} from "@/types/Classification";
import { ModelSettings } from "@/types/Model";

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

/**
 * Handling cors policy stuff.
 * @param res
 */
function handlePreflightRequest(res: NextApiResponse) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.NEXT_PUBLIC_ALLOW_CORS_ADDRESS as string
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");
  res.status(200).end();
}

/**
 * Getting extension of classification model. (.pth, .tflite)
 * We will use this information to run our classification model on right environment.
 * @param providerId
 * @returns
 */
async function getModelSettings(providerId: string) {
  try {
    const modelSettingsDocSnapshot = await firestore
      .doc(`/users/${providerId}/modelSettings/modelSettings`)
      .get();
    if (!modelSettingsDocSnapshot.exists) {
      console.error("Model settings doc does not exist.");
      return false;
    }

    const modelSettingsData = modelSettingsDocSnapshot.data() as ModelSettings;

    if (modelSettingsData === undefined) {
      console.error("Model settings data is undefined.");
      return false;
    }

    return modelSettingsData;
  } catch (error) {
    console.error("Error on getting classify point of provider: \n", error);
    return false;
  }
}

/**
 * Getting classification result from unique endpoints of providers.
 * @param providerId
 * @param imageURL
 * @returns
 */
async function getClassifyResult(providerId: string, imageURL: string | null) {
  const classifyEndpoint = process.env.PYTHON_CLASSIFY_API_ENDPOINT_V2;
  if (!classifyEndpoint) {
    console.error("Classify endpoint is undefined.");
    return false;
  }

  const apikey = process.env.PYTHON_API_KEY_V2;
  if (!apikey) {
    console.error("API key for classify is undefined.");
    return false;
  }

  const modelSettings = await getModelSettings(providerId);
  if (!modelSettings) return false;

  if (!imageURL) {
    return [
      {
        class_name: "text",
        probability: 0,
      },
    ] as PostPredictionObject[];
  }

  const modelPath = `/users/${providerId}/model/model.${modelSettings.modelExtension}`;
  const shape = modelSettings.inputImageSizes.split("x")[0];

  const formData = new FormData();

  formData.append("image_url", imageURL);
  formData.append("model_path_url", modelPath);
  formData.append("model_extension", `.${modelSettings.modelExtension}`);
  formData.append("img_width", shape);
  formData.append("img_height", shape);

  const response = await fetch(classifyEndpoint, {
    method: "POST",
    headers: {
      authorization: apikey,
    },
    body: formData,
  });

  if (!response.ok) {
    console.error(
      `Response from Python Classify API for ${providerId} is not okay: \n`,
      await response.text()
    );
    return false;
  }

  const result = await response.json();

  return result["predictions"] as PostPredictionObject[];
}

/**
 * Updating postThemes array on provider database.
 * @param providerId
 * @param postDocPath
 * @param predictions
 * @returns
 */
async function updatePostThemesArray(
  providerId: string,
  postDocPath: string,
  imageURL: string | null
) {
  const predictions = await getClassifyResult(providerId, imageURL);
  if (!predictions) return false;

  const postThemeObject: PostThemeObject = {
    postDocPath: postDocPath,
    ts: Date.now(),
    themes: predictions.map((prediction) => prediction.class_name),
  };

  try {
    await firestore.doc(`/users/${providerId}/postThemes/postThemes`).update({
      postThemesArray: fieldValue.arrayUnion({ ...postThemeObject }),
    });
    return true;
  } catch (error) {
    console.error(
      `Error on updating postThemes array of provider: ${providerId} : \n`,
      error
    );
    return false;
  }
}

/**
 * Updating client doc on provider database.
 * @param providerId
 * @param clientId
 * @param clientStartTime
 * @param predictions
 */
async function updateClientDoc(
  providerId: string,
  clientId: string,
  clientStartTime: string,
  imageURL: string | null
) {
  const predictions = await getClassifyResult(providerId, imageURL);
  if (!predictions) return false;

  const themeArrayObjectArray: ThemeObject[] = predictions.map(
    (prediction) => ({ theme: prediction.class_name, ts: Date.now() })
  );

  try {
    await firestore
      .doc(`/users/${providerId}/clients/${clientId}-${clientStartTime}`)
      .update({
        themesArray: fieldValue.arrayUnion(...themeArrayObjectArray),
      });
    return true;
  } catch (error) {
    console.error(
      `Error on updating client doc of provider: ${providerId} : \n`,
      error
    );
    return false;
  }
}

/**
 * Updating general posts on provider database.
 * @param postDocPath
 * @returns
 */
async function updatePosts(postDocPath: string) {
  const post: Post = {
    postDocPath: postDocPath,
    ts: Date.now(),
  };

  try {
    await firestore.doc("posts/posts").update({
      postsArray: fieldValue.arrayUnion({ ...post }),
    });
    return true;
  } catch (error) {
    console.error("Error on updating postsArray on posts/posts doc: \n", error);
    return false;
  }
}

/**
 * Gets active provider IDs.
 * @returns
 */
async function getActiveProviderIDs() {
  try {
    const showcaseCollection = await firestore.collection("showcase").get();

    if (showcaseCollection.empty) {
      console.error("Showcase collection is empty.");
      return false;
    }

    const providerIDs = showcaseCollection.docs.map((doc) => doc.id);
    return providerIDs;
  } catch (error) {
    console.error("Error on getting active provider IDs: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "OPTIONS") return handlePreflightRequest(res);
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;
  const { username, postDocPath, imageURL, providerId, startTime } = req.body;

  if (authorization !== process.env.API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("Unauthorized");

  if (!username || !postDocPath || !providerId)
    return res.status(422).send("Invalid Props");

  console.log("Post Upload Action initiated.");

  const activeProviderIDs = await getActiveProviderIDs();
  if (!activeProviderIDs) return res.status(500).send("Internal Server Error");

  for (const providerId of activeProviderIDs) {
    const result = await updatePostThemesArray(
      providerId,
      postDocPath,
      imageURL
    );
    if (!result) return res.status(500).send("Internal Server Error");
  }

  const updateClientDocResult = await updateClientDoc(
    providerId,
    username,
    startTime,
    imageURL
  );
  if (!updateClientDocResult)
    return res.status(500).send("Internal Server Error");

  const updatePostsResult = await updatePosts(postDocPath);
  if (!updatePostsResult) return res.status(500).send("Internal Server Error");

  return res.status(200).send("Success");
}
