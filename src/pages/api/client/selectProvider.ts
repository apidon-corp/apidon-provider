import { fieldValue, firestore } from "@/firebase/adminApp";
import { PostThemeObject, ThemeObject } from "@/types/Classification";
import { ClientDocData, InteractedPostObject } from "@/types/Client";
import { UserInServer } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

function handleAuthorization(key: string | undefined) {
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

function validateProps(
  username: string,
  providerId: string,
  interactedPostsObjectsArray: []
) {
  if (!username || !providerId || !interactedPostsObjectsArray) {
    console.error("Invalid Props");
    return false;
  }

  return true;
}

/**
 * Updates client doc and revenue fields.
 * @param providerId
 * @returns
 */
async function updateProviderDoc(providerId: string) {
  try {
    const providerDocSnapshot = await firestore
      .doc(`/users/${providerId}`)
      .get();

    if (!providerDocSnapshot.exists) {
      console.error("Provider doc doesn't exist.");
      return false;
    }

    const providerDocData = providerDocSnapshot.data() as UserInServer;
    if (!providerDocData) {
      console.error("Provider doc data is undefined.");
      return false;
    }

    const revenueIncrement = providerDocData.offer * 10;

    await providerDocSnapshot.ref.update({
      clientCount: fieldValue.increment(1),
      revenue: fieldValue.increment(revenueIncrement),
    });

    return providerDocData;
  } catch (error) {
    console.error(
      `Error while updating provider doc. (We were updating provider doc for: ${providerId})`
    );
    return false;
  }
}

async function updateProviderShowcase(providerId: string) {
  try {
    const showcaseDocRef = firestore.doc(`/showcase/${providerId}`);

    await showcaseDocRef.update({
      clientCount: fieldValue.increment(1),
    });

    return true;
  } catch (error) {
    console.error(
      `Error while updating provider showcase. (We were updating provider showcase for: ${providerId})`
    );
    return false;
  }
}

async function getPostThemesArray(username: string, providerId: string) {
  try {
    const postThemesDocSnapshot = await firestore
      .doc(`/users/${providerId}/postThemes/postThemes`)
      .get();

    if (!postThemesDocSnapshot.exists) {
      console.error("PostThemes doc doesn't exist.");
      return false;
    }

    const postThemesDocData = postThemesDocSnapshot.data();
    if (!postThemesDocData) {
      console.error("PostThemes doc data is undefined.");
      return false;
    }

    const postThemesArray =
      (postThemesDocData.postThemesArray as PostThemeObject[]) || [];

    return postThemesArray;
  } catch (error) {
    console.error(
      `Error while getting postThemes array. (We were getting postThemes array for: ${username})`
    );
    return false;
  }
}

function createThemesArray(
  postThemesArray: PostThemeObject[],
  interactedPostObjectArray: InteractedPostObject[]
) {
  const themeObjectArray: ThemeObject[] = [];

  for (const interaction of interactedPostObjectArray) {
    const foundPostThemeObject = postThemesArray.find(
      (postThemeObject) =>
        postThemeObject.postDocPath === interaction.postDocPath
    );
    if (!foundPostThemeObject) continue;

    const themeObjectArrayForThisPost: ThemeObject[] =
      foundPostThemeObject.themes.map((t) => ({
        theme: t,
        ts: interaction.creationTime || 53,
      }));

    themeObjectArray.push(...themeObjectArrayForThisPost);
  }
  return themeObjectArray;
}

async function createClientObject(
  username: string,
  providerId: string,
  themesArray: ThemeObject[],
  offer: number
) {
  const ts = Date.now();

  const id = `${username}-${providerId}-${ts}`;

  const clientObject: ClientDocData = {
    id: id,
    isActive: true,
    startTime: ts,
    themesArray: themesArray,
    username: username,
    offer: offer,
  };

  try {
    const clientDocRef = firestore.doc(`/users/${providerId}/clients/${id}`);
    await clientDocRef.set({ ...clientObject });
    return clientObject;
  } catch (error) {
    console.error(
      `Error while creating client object. (We were creating client object for: ${username}):`,
      error
    );
    return false;
  }
}

async function updateExistingProvider(
  oldProviderId: string,
  oldProviderClientId: string
) {
  try {
    const existingProviderDocSnapshot = await firestore
      .doc(`/users/${oldProviderId}`)
      .get();

    if (!existingProviderDocSnapshot.exists) {
      console.error("Existing provider doc doesn't exist.");
      return false;
    }

    const existingProviderDocData =
      existingProviderDocSnapshot.data() as UserInServer;
    if (!existingProviderDocData) {
      console.error("Existing provider doc data is undefined.");
      return false;
    }

    const revenueChange = -existingProviderDocData.offer * 10;
    await existingProviderDocSnapshot.ref.update({
      clientCount: fieldValue.increment(-1),
      revenue: fieldValue.increment(revenueChange),
    });

    const finalProfit = existingProviderDocData.offer;

    await firestore
      .doc(`/users/${oldProviderId}/clients/${oldProviderClientId}`)
      .update({
        isActive: false,
        endTime: Date.now(),
        finalProfit: finalProfit,
      });

    await firestore.doc(`/showcase/${oldProviderId}`).update({
      clientCount: fieldValue.increment(-1),
    });

    return true;
  } catch (error) {
    console.error(
      `Error while updating existing provider. (We were updating existing provider for: ${oldProviderId})`
    );
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const {
    username,
    providerId,
    interactedPostsObjectsArray,
    oldProviderId,
    oldProviderClientId,
  } = req.body;

  const authResult = handleAuthorization(authorization);
  if (!authResult) return res.status(401).send("Unauthorized");

  const propResult = validateProps(
    username,
    providerId,
    interactedPostsObjectsArray
  );
  if (!propResult) return res.status(422).send("Invalid Props");

  if (oldProviderId && oldProviderClientId) {
    const updateExistingProviderResult = await updateExistingProvider(
      oldProviderId,
      oldProviderClientId
    );
    if (!updateExistingProviderResult)
      return res.status(500).send("Internal Server Error");
  }

  const updateProviderDocResult = await updateProviderDoc(providerId);
  if (!updateProviderDocResult)
    return res.status(500).send("Internal Server Error");

  const updateShowcaseResult = await updateProviderShowcase(providerId);
  if (!updateShowcaseResult)
    return res.status(503).send("Internal Server Error");

  const postThemesArray = await getPostThemesArray(username, providerId);
  if (!postThemesArray) return res.status(503).send("Internal Server Error");

  const themesArray = createThemesArray(
    postThemesArray,
    interactedPostsObjectsArray
  );
  const createClientObjectResult = await createClientObject(
    username,
    providerId,
    themesArray,
    updateProviderDocResult.offer
  );
  if (!createClientObjectResult) {
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).json({
    providerId: providerId,
    startTime: createClientObjectResult.startTime,
    offer: createClientObjectResult.offer,
    clientId: createClientObjectResult.id,
  });
}
