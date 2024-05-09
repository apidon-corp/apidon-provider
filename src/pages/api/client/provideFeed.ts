import { firestore } from "@/firebase/adminApp";
import {
  CombinedScoredPostThemeObject,
  PostThemeObject,
  RelevanceScoredPostThemeObject,
  ThemeObject,
} from "@/types/Classification";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to provideFeed API.");
    return false;
  }

  const apiKey = process.env.API_KEY_BETWEEN_SERVICES;
  if (apiKey === undefined) {
    console.error("API_KEY_BETWEEN_SERVICES is undefined");
    return false;
  }

  if (key !== apiKey) {
    console.error("Unauthorized attempt to provideFeed API.");
    return false;
  }

  return true;
}

function validateProps(username: string, provider: string, startTime: number) {
  if (!username || !provider || !startTime) {
    console.error("Invalid Props");
    return false;
  }

  return true;
}

/**
 * Getting what client interested from clients/{clientName}(username)-{start-time}/themesArray
 * @param username
 * @param provider
 * @param startTime
 * @returns Array of what user interested like [cat,dog,whale]
 */
async function getWhatClientIntersted(
  username: string,
  provider: string,
  startTime: number
) {
  try {
    const clientDocSnapshot = await firestore
      .doc(`/users/${provider}/clients/${username}-${startTime}`)
      .get();

    if (!clientDocSnapshot.exists) {
      console.error("Client doc doesn't exist.");
      return false;
    }

    const clientDocData = clientDocSnapshot.data();
    if (clientDocData === undefined) {
      console.error("Client doc data is undefined.");
      return false;
    }

    const themesArray = clientDocData.themesArray as ThemeObject[];

    // We need to handle this carefully later for first time users.
    if (!themesArray) {
      console.error("themesArray is undefined");
      return false;
    }

    // We need to handle this carefully later for first time users.
    if (themesArray.length === 0) {
      console.warn("This user has no theme object in its themesArray");
      return false;
    }

    const themesOnly = themesArray.map((theme) => theme.theme);
    return themesOnly;
  } catch (error) {
    console.error("Error on getting client doc", error);
    return false;
  }
}

/**
 * @param provider
 * @returns Doc paths and tags of all posts in server like [ { postDocPath : "/users/yunuskorkmaz/posts/post1", themes: [cat,dog,whale], ts: 150220069 } ]
 */
async function getAllPostsWithTheirThemes(provider: string) {
  try {
    const postThemesSnapshot = await firestore
      .doc(`/users/${provider}/postThemes/postThemes`)
      .get();

    if (!postThemesSnapshot.exists) {
      console.error("postThemes doc doesn't exist.");
      return false;
    }

    const postThemesDocData = postThemesSnapshot.data();
    if (postThemesDocData === undefined) {
      console.error("postThemes doc data is undefined.");
      return false;
    }

    const postThemesArray =
      postThemesDocData.postThemesArray as PostThemeObject[];

    if (postThemesArray.length === 0) {
      console.error(
        "postThemesArray is empty. This can be only caused by an integration error."
      );
      return false;
    }

    return postThemesArray;
  } catch (error) {
    console.error("Error on getting postThemes doc", error);
    return false;
  }
}

/**
 * Ranks posts for client based on their themes.
 * @param username
 * @param provider
 * @param startTime
 * @returns Creates relevence scored posts array.
 */
async function createRelevanceScoredPostObjects(
  username: string,
  provider: string,
  startTime: number
) {
  const clientInterestedThemes = await getWhatClientIntersted(
    username,
    provider,
    startTime
  );
  if (!clientInterestedThemes) return false;

  const postsWithTheirThemes = await getAllPostsWithTheirThemes(provider);
  if (!postsWithTheirThemes) return false;

  const relevanceScoredPostThemeObjects: RelevanceScoredPostThemeObject[] = [];

  for (const postWithItsTheme of postsWithTheirThemes) {
    let relevanceScore = 0;
    postWithItsTheme.themes.map((theme) => {
      if (clientInterestedThemes.includes(theme)) relevanceScore++;
    });

    relevanceScore = relevanceScore / postWithItsTheme.themes.length;

    relevanceScoredPostThemeObjects.push({
      postDocPath: postWithItsTheme.postDocPath,
      themes: postWithItsTheme.themes,
      ts: postWithItsTheme.ts,
      relevanceScore: relevanceScore,
    });
  }

  return relevanceScoredPostThemeObjects;
}

async function getAlgorithmSettings(provider: string) {
  try {
    const algorithmSettingsSnapshot = await firestore
      .doc(`/users/${provider}/modelSettings/algorithmSettings`)
      .get();
    if (!algorithmSettingsSnapshot.exists) {
      console.error("Algorithm settings doc doesn't exist.");
      return false;
    }

    const algorithmSettingsData = algorithmSettingsSnapshot.data();
    if (algorithmSettingsData === undefined) {
      console.error("Algorithm settings data is undefined.");
      return false;
    }

    const recencyWeight = algorithmSettingsData.recencyWeight;
    const relevanceWeight = algorithmSettingsData.relevanceWeight;

    if (!recencyWeight || !relevanceWeight) {
      console.error("Recency weight or relevance weight is undefined.");
      return false;
    }

    return {
      recencyWeight: recencyWeight,
      relevanceWeight: relevanceWeight,
    };
  } catch (error) {
    console.error("Error on getting algorithm settings doc", error);
    return false;
  }
}

async function createCombinedScoredPostsObjects(
  username: string,
  provider: string,
  startTime: number,
  relevancyWeight: number,
  recencyWeight: number
) {
  const relevanceScoredPostThemeObjects =
    await createRelevanceScoredPostObjects(username, provider, startTime);
  if (!relevanceScoredPostThemeObjects) {
    console.error("Error on creating rankedPostObjects");
    return false;
  }

  const currentTime = Date.now();

  const rankedPostThemeObjects: CombinedScoredPostThemeObject[] = [];

  for (const relevanceScoredPostThemeObject of relevanceScoredPostThemeObjects) {
    const postCreationTime = relevanceScoredPostThemeObject.ts;
    const timeDifference = currentTime - postCreationTime;

    // Normalize time difference
    const normalizedRecency = 1 / timeDifference / (1000 * 60 * 60 * 24);

    // Normalize relevancy score. (It is already relevanced)
    const normalizedRelevancy = relevanceScoredPostThemeObject.relevanceScore;

    // Calculate combined score with weights
    const combinedScore =
      recencyWeight * normalizedRecency + relevancyWeight * normalizedRelevancy;

    rankedPostThemeObjects.push({
      postDocPath: relevanceScoredPostThemeObject.postDocPath,
      themes: relevanceScoredPostThemeObject.themes,
      ts: relevanceScoredPostThemeObject.ts,
      combinedScore: combinedScore,
    });
  }

  return rankedPostThemeObjects;
}

async function preparePostsForClient(
  username: string,
  provider: string,
  startTime: number
) {
  const algorithmSettings = await getAlgorithmSettings(provider);
  if (!algorithmSettings) return false;

  const relevancyWeight = algorithmSettings.relevanceWeight;
  const recencyWeight = algorithmSettings.recencyWeight;

  const combinedScoredPosts = await createCombinedScoredPostsObjects(
    username,
    provider,
    startTime,
    relevancyWeight,
    recencyWeight
  );

  if (!combinedScoredPosts) {
    console.error("Error on creating combinedScoredPostsObjects");
    return false;
  }

  const sortedPosts = combinedScoredPosts
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .map((post) => post.postDocPath);

  return sortedPosts;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { username, provider, startTime } = req.body;

  const authResult = await handleAuthorization(authorization);
  if (!authResult) return res.status(401).send("Unauthorized");

  const propResult = validateProps(username, provider, startTime);
  if (!propResult) return res.status(422).send("Invalid Props");

  const postDocPathArray = await preparePostsForClient(
    username,
    provider,
    startTime
  );
  if (!postDocPathArray) return res.status(500).send("Internal Server Error");

  return res.status(200).json({
    postDocPathArray: postDocPathArray,
    adObjectArray: [],
  });
}
