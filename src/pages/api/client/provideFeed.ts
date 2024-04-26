import { firestore } from "@/firebase/adminApp";
import {
  PostThemeObject,
  PostThemeObjectValued,
  ThemeObject,
} from "@/types/Classification";
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
  const { username, provider, startTime } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("Unauthorized");

  if (!username || !provider) {
    return res.status(422).send("Invalid Prop or Props");
  }

  let providerDocSnapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    providerDocSnapshot = await firestore.doc(`users/${provider}`).get();
  } catch (error) {
    console.error("Error while getting providerDocSnapshot", error);
    return res.status(503).send("Firebase Error");
  }

  if (!providerDocSnapshot.exists)
    return res.status(422).send("Invalid Provider Name");

  /**
   * 1-) Getting themes array of user
   * 2-) Look postThemes/postThemes for themes array...
   * 3-) Return the result to user.
   */

  /**
   * 1-) Getting themes array of user
   */

  let themesArrayOfClient;
  try {
    const clientDocOnProvider = await firestore
      .doc(`users/${provider}/clients/${username}-${startTime}`)
      .get();
    if (clientDocOnProvider.exists === false)
      throw new Error("Client Doc on Proivder doesn't exist.");

    if (clientDocOnProvider.data()!.themesArray === undefined) {
      throw new Error(
        "Client Doc on Proivder doesn't have 'themesArray' field"
      );
    }

    themesArrayOfClient = clientDocOnProvider.data()!
      .themesArray as ThemeObject[];
  } catch (error) {
    console.error(
      "Erron on creating feed for user. We were on getting clientDocOnProvider",
      error
    );
    return res.status(500).send("Internal Server Error");
  }
  let postThemesArray: PostThemeObject[];
  try {
    const postThemesDoc = await firestore
      .doc(`users/${provider}/postThemes/postThemes`)
      .get();

    if (postThemesDoc.exists === false)
      throw new Error("Post Themes Doc doesn't exist");

    if (postThemesDoc.data()!.postThemesArray === undefined) {
      throw new Error("Post Themes Doc doesn't have postThemesArray field.");
    }
    postThemesArray = postThemesDoc.data()!.postThemesArray;
  } catch (error) {
    console.error(
      "Error while creating feed for user. We were getting postThemes/postThemes doc",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  let clientKeys: string[] = [];
  for (const clinetThemeObject of themesArrayOfClient) {
    clientKeys.push(clinetThemeObject.theme);
  }

  let postDocPathArray: string[] = [];

  let valuedPostThemeObjectArray: PostThemeObjectValued[] = [];

  for (const postThemeObject of postThemesArray) {
    const themes = postThemeObject.themes;
    let value = 0;
    for (const theme of themes) {
      // Simulating different algorithms has different technics

      if (provider === "LogicHead") {
        if (clientKeys.includes(theme)) value++;
      } else if (provider === "SmartFeed") {
        const random = Math.round(Math.random()); // 0 or 1
        if (random === 1) if (clientKeys.includes(theme)) value++;
        if (random === 0) if (clientKeys.includes(theme)) value--;
      }
    }

    if (value === 0) continue;

    const valuedPostThemeObject: PostThemeObjectValued = {
      postDocPath: postThemeObject.postDocPath,
      themes: postThemeObject.themes,
      ts: postThemeObject.ts,
      value: value,
    };

    valuedPostThemeObjectArray.push(valuedPostThemeObject);
  }

  valuedPostThemeObjectArray.sort((a, b) => b.value - a.value);

  for (const valuedPostThemeObject of valuedPostThemeObjectArray) {
    postDocPathArray.push(valuedPostThemeObject.postDocPath);
  }

  postDocPathArray = Array.from(new Set(postDocPathArray));

  return res.status(200).json({
    postDocPathArray: postDocPathArray,
    adObjectArray: [],
  });
}
