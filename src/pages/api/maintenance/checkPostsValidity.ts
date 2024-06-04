import { fieldValue, firestore } from "@/firebase/adminApp";
import { Post, PostServerData, PostThemeObject } from "@/types/Classification";
import { NextApiRequest, NextApiResponse } from "next";

const handleAuthorization = (authorization: string | undefined) => {
  if (!authorization) return false;

  const apiKey = process.env.CHECK_POSTS_VALIDITY_KEY;
  if (!apiKey) return;

  return authorization === apiKey;
};

async function getAllPostsDocPath() {
  try {
    const postsDocSnapshot = await firestore.doc("/posts/posts").get();

    if (!postsDocSnapshot.exists) {
      console.error("/posts/posts doc doesn't exist");
      return false;
    }

    const postDocData = postsDocSnapshot.data();
    if (!postDocData) {
      console.error("Posts doc data is empty");
      return false;
    }

    const postsArray = postDocData.postsArray as Post[];

    if (!postsArray) {
      console.error("Posts array is empty");
      return false;
    }

    return {
      postDocPaths: postsArray.map((post) => post.postDocPath),
      postsArray: postsArray,
    };
  } catch (error) {
    console.error("Error on getting posts array: \n", error);
    return false;
  }
}

/**
 * Checks If post still exists in database of users.
 * Posts can be deleted by users, or something else. So we need to check them.
 * @param postDocPath
 * @param apiKey
 * @param providePostInformationEndpoint
 * @returns If there is a server problem return false, otherwise returns status of post.
 */
async function checkPostValidity(
  postDocPath: string,
  apiKey: string,
  providePostInformationEndpoint: string
) {
  try {
    const response = await fetch(providePostInformationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify({
        postDocPath: postDocPath,
      }),
    });

    if (!response.ok) {
      console.error(
        `Response from ${providePostInformationEndpoint} is not okay: \n`,
        await response.text()
      );
      return false;
    }

    const result = await response.json();

    const postDocData = result.postDocData as false | PostServerData;

    if (postDocData === false) {
      console.log("This post doc doesn't exist anymore: ", postDocPath);
      return {
        postDocPath: postDocPath,
        isValid: false,
      };
    }

    return {
      postDocPath: postDocPath,
      isValid: true,
    };
  } catch (error) {
    console.error("Error on checking post validity: \n", error);
    return false;
  }
}

/**
 * @param postDocPaths
 * @returns posts that doesn't exist in user database anymore...
 */
async function checkAllPostsValidity(postDocPaths: string[]) {
  const apiKeyBetweenServices = process.env.API_KEY_BETWEEN_SERVICES;
  if (!apiKeyBetweenServices) {
    console.error(
      "API key between services couldn't be fetched from .env file."
    );
    return false;
  }

  const userPanelBaseURL = process.env.USER_PANEL_BASE_URL;
  if (!userPanelBaseURL) {
    console.error("User panel base url couldn't be fetched from .env file.");
    return false;
  }

  const providePostInformationEndpoint = `${userPanelBaseURL}/api/provider/providePostInformation`;

  const results = await Promise.all(
    postDocPaths.map((p) =>
      checkPostValidity(
        p,
        apiKeyBetweenServices,
        providePostInformationEndpoint
      )
    )
  );

  const invalidPosts = results.filter(
    (r) => r !== false && r.isValid === false
  ) as { postDocPath: string; isValid: false }[];

  console.log("Invalid Posts: ", invalidPosts);

  return invalidPosts.map((p) => p.postDocPath);
}

async function getProviders() {
  try {
    const usersCollection = await firestore.collection("/users").get();

    const userCollectionDocs = usersCollection.docs;

    return userCollectionDocs.map((doc) => doc.id);
  } catch (error) {
    console.error("Error on getting providers: \n", error);
    return false;
  }
}

async function removePostDocPathFromPostThemesArray(
  invalidPostDocPaths: string[],
  providerId: string
) {
  try {
    const postThemeDocRef = firestore.doc(
      `/users/${providerId}/postThemes/postThemes`
    );

    const postThemeDocSnapshot = await postThemeDocRef.get();
    if (!postThemeDocSnapshot.exists) {
      console.error("Post theme doc doesn't exist");
      return false;
    }

    const postThemeDocData = postThemeDocSnapshot.data();
    if (!postThemeDocData) {
      console.error("Post theme doc data is undefined");
      return false;
    }

    const postThemesArray =
      postThemeDocData.postThemesArray as PostThemeObject[];
    if (!postThemesArray) {
      console.error("Post themes array is undefined");
      return false;
    }

    const deletedPostThemeObjects: PostThemeObject[] = [];

    for (const postThemeObject of postThemesArray) {
      for (const invalidPostPath of invalidPostDocPaths) {
        if (postThemeObject.postDocPath === invalidPostPath) {
          deletedPostThemeObjects.push(postThemeObject);
        }
      }
    }

    if (deletedPostThemeObjects.length === 0) {
      return true;
    }

    await postThemeDocRef.update({
      postThemesArray: fieldValue.arrayRemove(...deletedPostThemeObjects),
    });

    return true;
  } catch (error) {
    console.error(
      "Error on removing post doc path from post themes array: \n",
      error
    );
    return false;
  }
}

async function removePostDocPathFromPostThemesArrayForAllProviders(
  providers: string[],
  invalidPostDocPaths: string[]
) {
  const results = await Promise.all(
    providers.map((p) =>
      removePostDocPathFromPostThemesArray(invalidPostDocPaths, p)
    )
  );
  if (results.includes(false)) {
    console.error("One or more result is false.");
    return false;
  }

  return true;
}

async function removeInvalidPostsFromPostsDoc(
  invalidPostDocPaths: string[],
  postsArray: Post[]
) {
  if (invalidPostDocPaths.length === 0) return true;

  const deletedPostObjects: Post[] = [];

  for (const postObject of postsArray) {
    for (const invalidPostDocPath of invalidPostDocPaths) {
      if (postObject.postDocPath === invalidPostDocPath) {
        deletedPostObjects.push(postObject);
      }
    }
  }

  try {
    const postsDocRef = firestore.doc("/posts/posts");

    await postsDocRef.update({
      postsArray: fieldValue.arrayRemove(...deletedPostObjects),
    });

    return true;
  } catch (error) {
    console.error("Error on removing invalid posts from posts doc: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;

  const authorizationResult = handleAuthorization(authorization);
  if (!authorizationResult) return res.status(401).send("Unauthorized");

  const getPostsResult = await getAllPostsDocPath();
  if (!getPostsResult) return res.status(500).send("Internal Server Error");

  const [invalidPosts, providers] = await Promise.all([
    checkAllPostsValidity(getPostsResult.postDocPaths),
    getProviders(),
  ]);
  if (!invalidPosts || !providers)
    return res.status(500).send("Internal Server Error");

  const [
    removeInvalidPostsFromProvidersThemesResult,
    removeInvalidPostsFromPostsDocResult,
  ] = await Promise.all([
    removePostDocPathFromPostThemesArrayForAllProviders(
      providers,
      invalidPosts
    ),
    removeInvalidPostsFromPostsDoc(invalidPosts, getPostsResult.postsArray),
  ]);
  if (
    !removeInvalidPostsFromProvidersThemesResult ||
    !removeInvalidPostsFromPostsDocResult
  )
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("Success");
}
