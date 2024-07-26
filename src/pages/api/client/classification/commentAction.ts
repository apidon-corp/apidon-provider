import { fieldValue, firestore } from "@/firebase/adminApp";
import { PostThemeObject, ThemeObject } from "@/types/Classification";

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

/**
 * Handling cors policy stuff.
 * @param res
 */
function handlePreflightRequest(res: NextApiResponse) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.USER_PANEL_BASE_URL as string
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");
  res.status(200).end();
}

function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to likeAction API.");
    return false;
  }

  const apiKeyBetweenServices = process.env.API_KEY_BETWEEN_SERVICES;
  if (!apiKeyBetweenServices) {
    console.error("API_KEY_BETWEEN_SERVICES is undefined from .env file.");
    return false;
  }

  return key === apiKeyBetweenServices;
}

function handleProps(
  clientId: string,
  providerId: string,
  postDocPath: string
) {
  if (!clientId || !providerId || !postDocPath) {
    console.error("Invalid Props");
    return false;
  }

  return true;
}

async function getPostThemesArrayOfProvider(providerId: string) {
  try {
    const postThemesDocSnapshot = await firestore
      .doc(`/users/${providerId}/postThemes/postThemes`)
      .get();

    if (!postThemesDocSnapshot.exists) {
      console.error("Post Themes Doc doesn't exist.");
      return false;
    }

    const postThemesDocData = postThemesDocSnapshot.data();
    if (!postThemesDocData) {
      console.error("postThemes doc data is undefined.");
      return false;
    }

    const postThemesArray =
      postThemesDocData.postThemesArray as PostThemeObject[];

    return {
      postThemesArray: postThemesArray,
    };
  } catch (error) {
    console.error("Error on getting postThemes doc", error);
    return false;
  }
}

async function createThemeObjectsOfCommentedPost(
  postDocPath: string,
  postThemeObjects: PostThemeObject[]
) {
  let themeObjects: ThemeObject[] = [];

  for (const postThemeObject of postThemeObjects) {
    if (
      !(
        postThemeObject.postDocPath === postDocPath ||
        postThemeObject.postDocPath === `/${postDocPath}`
      )
    )
      continue;

    themeObjects = postThemeObject.themes.map((p) => {
      const themeObject: ThemeObject = {
        theme: p,
        ts: Date.now(),
      };
      return themeObject;
    });
  }

  if (themeObjects.length === 0) {
    console.error(
      "Theme objects couldn't find for commented post: ",
      postDocPath
    );
    return false;
  }

  return {
    themeObjects: themeObjects,
  };
}

async function updateClientDoc(
  clientId: string,
  providerId: string,
  themeObjects: ThemeObject[]
) {
  try {
    const clientDocRef = firestore.doc(
      `/users/${providerId}/clients/${clientId}`
    );

    await clientDocRef.update({
      themesArray: fieldValue.arrayUnion(...themeObjects),
    });

    return true;
  } catch (error) {
    console.error(
      "Error while updating themesArray of user on provider database",
      error
    );
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
  const { providerId, clientId, postDocPath } = req.body;

  const handleAuthorizationResult = handleAuthorization(authorization);
  if (!handleAuthorizationResult) return res.status(401).send("Unauthorized");

  const handlePropResult = handleProps(clientId, providerId, postDocPath);
  if (!handlePropResult) return res.status(422).send("Invalid Props");

  const getPostThemesArrayOfProviderResult = await getPostThemesArrayOfProvider(
    providerId
  );

  if (!getPostThemesArrayOfProviderResult)
    return res.status(500).send("Internal Server Error");

  const createThemeObjectsOfCommentedPostResult =
    await createThemeObjectsOfCommentedPost(
      postDocPath,
      getPostThemesArrayOfProviderResult.postThemesArray
    );

  if (!createThemeObjectsOfCommentedPostResult)
    return res.status(500).send("Internal Server Error");

  const updateClientDocResult = await updateClientDoc(
    clientId,
    providerId,
    createThemeObjectsOfCommentedPostResult.themeObjects
  );

  if (!updateClientDocResult)
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("Success");
}
