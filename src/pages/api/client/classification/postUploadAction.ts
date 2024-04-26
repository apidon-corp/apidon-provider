import { fieldValue, firestore } from "@/firebase/adminApp";
import { Post, PostThemeObject, ThemeObject } from "@/types/Classification";

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
  /**
   * To handle cors policy...
   */
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
  const { username, postDocPath, imageURL, providerId, startTime } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("unauthorized");

  // But some posts doesn't have image...
  if (!username || !postDocPath || !providerId)
    return res.status(422).send("Invalid Prop or Props.");

  /**
   * We will do:
   *  0-) Geting what image is about from API.
   *  1-) Update providerId/clients/clientId doc's themesArray array that => He loves cat, dogs...
   *  2-) Update providerId/postThemes/postThemes doc's postThemesArray array that => postId123 is about cat,dogs, pumas.
   *  3-) Update posts/posts doc's postsArray array that => postDocPath and Timestamp
   */

  await lock.acquire(`${username}`, async () => {
    /**
     * 0-) Geting what image is about from API.
     * Sends imageURL to Classify Modal and gets results as an array.....
     */

    let probabiltiesArray: { label: string; score: number }[] = [];
    if (imageURL)
      try {
        const classifyEndpoint =
          process.env.PYTHON_CLASSIFICATION_MODEL_CLASSIFY_END_POINT;
        if (!classifyEndpoint)
          throw new Error(
            "Classify Endpoint couldn't be fetch from .env file."
          );

        const response = await fetch(classifyEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageURL,
          }),
        });
        if (!response.ok) {
          throw new Error(
            `Response from Python Classify API is not okay: ${await response.text()}`
          );
        }

        const result = await response.json();

        probabiltiesArray = result["Combined Predictions"];
      } catch (error) {
        console.error("Error while fetching to classify API (Python): ", error);
        return res.status(500).send("Internal Server Error");
      }
    else {
      probabiltiesArray = [
        {
          label: "text",
          score: 1,
        },
      ];
    }

    let themesArray: ThemeObject[] = [];
    let onlyThemesArray: string[] = [];

    probabiltiesArray.forEach((a) => {
      const newThemeObject: ThemeObject = {
        theme: a.label,
        ts: Date.now(),
      };
      themesArray.push(newThemeObject);
      onlyThemesArray.push(a.label);
    });

    /**
     * 1-) Update providerId/clients/clientId doc's themesArray array that => He loves cat, dogs...
     */

    try {
      await firestore
        .doc(`users/${providerId}/clients/${username}-${startTime}`)
        .update({
          themesArray: fieldValue.arrayUnion(...themesArray),
        });
    } catch (error) {
      console.log(error);
      console.error("Error on updation themes doc", error);
      return res
        .status(500)
        .send(
          "Internal Server Error on updating themes array on user at provider client list."
        );
    }

    /**
     * 2-) Update all provider's  providerId/postThemes/postThemes doc's postThemesArray array that => postId123 is about cat,dogs, pumas.
     */

    const postThemeObject: PostThemeObject = {
      postDocPath: postDocPath,
      themes: [...onlyThemesArray],
      ts: Date.now(),
    };

    let providerDocs;
    try {
      providerDocs = await firestore.collection("users").get();
    } catch (error) {
      console.error(
        "Error on postClassification API. We were getting all providers docs to update their postThemes/postThemes doc.",
        error
      );
      return res.status(500).send("Internal Server Error");
    }

    for (const providerDoc of providerDocs.docs) {
      try {
        await firestore
          .doc(`${providerDoc.ref.path}/postThemes/postThemes`)
          .update({
            postThemesArray: fieldValue.arrayUnion({ ...postThemeObject }),
          });
      } catch (error) {
        console.error(
          "Errron on updating postThemes/postThemes doc....",
          error
        );
        return res
          .status(500)
          .send(
            "Internal Server Error on updating postThemes array on provider/postThemes/postThemes."
          );
      }
    }

    /**
     * 3-) Update posts/posts doc's postsArray array that => postDocPath and Timestamp
     */

    const post: Post = {
      postDocPath: postDocPath,
      ts: Date.now(),
    };
    try {
      await firestore.doc("posts/posts").update({
        postsArray: fieldValue.arrayUnion({
          ...post,
        }),
      });
    } catch (error) {
      console.error("Errron on updating posts/posts doc....", error);
      return res
        .status(500)
        .send(
          "Internal Server Error on updating postsArray array on posts/posts."
        );
    }
  });

  return res.status(200).send("Success on Post Classifying...");
}
