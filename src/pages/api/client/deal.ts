import { fieldValue, firestore } from "@/Firebase/adminApp";
import { PostThemeObject, ThemeObject } from "@/types/Classification";
import { ClientObject, InteractedPostObject } from "@/types/Client";
import { IDealResult } from "@/types/User";
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
  const { username, provider, interactedPostsObjectsArray } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("unauthorized");

  if (!username || !provider) {
    return res.status(422).send("Invalid prop or props");
  }

  let providerDocSnapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    providerDocSnapshot = await firestore.doc(`users/${provider}`).get();
  } catch (error) {
    console.error("Error while deal. (We were getting provider doc snapshot");
    return res.status(503).send("Firebase Error");
  }

  if (!providerDocSnapshot.exists)
    return res.status(422).send("Invalid Provider Name");

  try {
    await providerDocSnapshot.ref.update({
      clientCount: fieldValue.increment(1),
      revenue: fieldValue.increment(providerDocSnapshot.data()?.offer * 1.1),
    });
  } catch (error) {
    console.error("error while deal. (We were updating provider doc.");
    return res.status(503).send("Firebase Error");
  }
  try {
    await firestore.doc(`showcase/${provider}`).update({
      clientCount: fieldValue.increment(1),
    });
  } catch (error) {
    console.error(
      `error while deal. (We were updating showcase doc for: ${provider}`
    );
    return res.status(503).send("Firebase Error");
  }
  const startTime = Date.now();
  const thirtyDay = 30 * 24 * 60 * 60 * 1000;
  const tenMinutes = 60 * 10 * 1000;
  const dealResultObject: IDealResult = {
    name: provider,
    startTime: startTime,
    endTime: startTime + thirtyDay,
    yield: providerDocSnapshot.data()?.offer,
  };

  /**
   * We need to analyze user and create its "themesArray" array, so:
   *  1-) We have all interaction informations as "like", "comment", "uploaded" and their activity times.
   *  2-) We need to analyze this information and create themes array.
   *  3-) We need to use classification API's for it or not.
   */

  const themesArrayToServer: ThemeObject[] = [];

  try {
    const postThemesDoc = await firestore
      .doc(`users/${provider}/postThemes/postThemes`)
      .get();
    if (!postThemesDoc.exists)
      throw new Error("Post Themes Doc doesn't exist.");

    const themesArray = postThemesDoc.data()!
      .postThemesArray as PostThemeObject[];

    for (const interactedPostObject of interactedPostsObjectsArray as InteractedPostObject[]) {
      const foundInteractedPostObjectInProviderDatabase = themesArray.find(
        (a) => a.postDocPath === interactedPostObject.postDocPath
      );
      if (!foundInteractedPostObjectInProviderDatabase) {
        console.warn(
          "Interacted post doesn't exist in postThemes/postThemes in Provider's database."
        );
        continue;
      }

      let createdThemesArray: ThemeObject[] = [];
      for (const theme of foundInteractedPostObjectInProviderDatabase.themes) {
        const newCreatedThemeObject: ThemeObject = {
          theme: theme,
          ts: foundInteractedPostObjectInProviderDatabase.ts,
        };
        createdThemesArray.push(newCreatedThemeObject);
      }

      themesArrayToServer.push(...createdThemesArray);
    }
  } catch (error) {
    console.error("errror while creating themes for client", error);
    return res.status(500).send("Internal Server Error");
  }

  let clientObject: ClientObject = {
    active: true,
    endTime: startTime + thirtyDay,
    score: 0,
    startTime: startTime,
    debt: providerDocSnapshot.data()?.offer,
    withdrawn: false,
    themesArray: [...themesArrayToServer],
  };

  try {
    await firestore
      .doc(`users/${provider}/clients/${username}-${startTime}`)
      .set(clientObject);
  } catch (error) {
    console.error("Error while deal. We were adding client doc.");
    return res.status(503).send("Firebase Error");
  }

  return res.status(200).json({ dealResult: dealResultObject });
}
