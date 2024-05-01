import { fieldValue, firestore } from "@/firebase/adminApp";
import { PostThemeObject, ThemeObject } from "@/types/Classification";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";

const lock = new AsyncLock();

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.NEXT_PUBLIC_ALLOW_CORS_ADDRESS as string
  );

  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;
  const { username, providerId, startTime, postDocPath } = req.body;

  if (authorization !== process.env.API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("Unauthorized");

  if (!username || !providerId || !startTime || !postDocPath) {
    return res.status(422).send("Invalid Prop or Props");
  }

  await lock.acquire(`${username}-commentAction`, async () => {
    /**
     * !!!! We will update /providerId/client doc's themesArray field.
     *  1-) We need to find out post classification results from provider's postThemes/postThemes doc's postThemesArray.
     *  2-) Then we need to update providerId/client doc's themesArray field.
     */

    /**
     * 1-) Getting post's tags (what post about....)
     */
    let postThemes;
    try {
      const postThemesDoc = await firestore
        .doc(`users/${providerId}/postThemes/postThemes`)
        .get();
      if (!postThemesDoc.exists)
        throw new Error("Post Themes Doc doesn't exist.");

      const themesArray = postThemesDoc.data()!
        .postThemesArray as PostThemeObject[];
      const postThemeObject = themesArray.find(
        (postThemeObject) => postThemeObject.postDocPath === postDocPath
      );
      if (!postThemeObject)
        throw new Error("Commented post doesn't exist in provider's database.");
      postThemes = postThemeObject.themes;
    } catch (error) {
      console.error(
        "Error while getting commented post tags (what it is about)",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    /**
     * 2-) providerId/client doc's themesArray field.
     */
    let newThemeObjectArrayToJoin: ThemeObject[] = [];
    for (const postTheme of postThemes) {
      const themeObject: ThemeObject = { theme: postTheme, ts: Date.now() };
      newThemeObjectArrayToJoin.push(themeObject);
    }
    try {
      await firestore
        .doc(`/users/${providerId}/clients/${username}-${startTime}`)
        .update({
          themesArray: fieldValue.arrayUnion(...newThemeObjectArrayToJoin),
        });
    } catch (error) {
      console.error(
        "Error while updating themesArray of user on provider database",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    return res.status(200).send("Successfull");
  });
}
