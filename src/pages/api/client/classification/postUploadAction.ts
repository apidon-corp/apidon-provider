import { fieldValue, firestore } from "@/firebase/adminApp";
import {
  Post,
  PostPredictionObject,
  PostThemeObject,
  ThemeObject,
} from "@/types/Classification";
import { ModelSettingsServer } from "@/types/Model";

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
 * Getting unique classify endpoint.
 * @param providerId
 * @returns
 */
async function getClassifyEndpoint(providerId: string) {
  try {
    const modelSettingsDocSnapshot = await firestore
      .doc(`/users/${providerId}/modelSettings/modelSettings`)
      .get();
    if (!modelSettingsDocSnapshot.exists) {
      console.error("Model settings doc does not exist.");
      return false;
    }

    const modelSettingsData =
      modelSettingsDocSnapshot.data() as ModelSettingsServer;

    if (modelSettingsData === undefined) {
      console.error("Model settings data is undefined.");
      return false;
    }

    return modelSettingsData.modelAPIEndpoint;
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
  const classifyEndpoint = await getClassifyEndpoint(providerId);
  if (!classifyEndpoint) return false;

  if (!imageURL) {
    return [
      {
        label: "text",
        score: 0,
      },
    ] as PostPredictionObject[];
  }

  const apikey = process.env.PYTHON_CLASSIFICATION_MODEL_API_KEY;

  if (!apikey) {
    console.error("API key for classify is undefined.");
    return false;
  }

  const response = await fetch(classifyEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      APIKEY: apikey,
    },
    body: JSON.stringify({
      image_url: imageURL,
    }),
  });

  if (!response.ok) {
    console.error(
      `Response from Python Classify API for ${providerId} is not okay: \n`,
      await response.text()
    );
    return false;
  }

  const result = await response.json();

  return result["Combined Predictions"] as PostPredictionObject[];
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
    themes: predictions.map((prediction) => prediction.label),
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
    (prediction) => ({ theme: prediction.label, ts: Date.now() })
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

  const { authorization } = req.headers;
  const { username, postDocPath, imageURL, providerId, startTime } = req.body;

  if (authorization !== process.env.API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("Unauthorized");

  if (!username || !postDocPath || !providerId)
    return res.status(422).send("Invalid Props");

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

  return res.status(200).send("Success on Post Classifying...");
}
