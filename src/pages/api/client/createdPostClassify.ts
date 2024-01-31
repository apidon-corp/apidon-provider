import { fieldValue, firestore } from "@/Firebase/adminApp";
import { ThemeObject } from "@/types/Clients";
import AsyncLock from "async-lock";
import { NextApiRequest, NextApiResponse } from "next";

const lock = new AsyncLock();

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
    return res.status(401).json({ error: "unauthorized" });

  if (!username || !postDocPath || !imageURL || !providerId)
    return res.status(422).send("Invalid Prop or Props.");

  await lock.acquire(`${username}-${postDocPath}`, async () => {
    // Sends imageURL to Classify Modal and gets results as an array.....
    const probabiltiesArray = ["cat", "tiger", "puma"];

    let themesArray: ThemeObject[] = [];

    probabiltiesArray.forEach((a) => {
      const newThemeObject: ThemeObject = {
        theme: a,
        ts: Date.now(),
      };
      themesArray.push(newThemeObject);
    });

    try {
      await firestore
        .doc(`users/${providerId}/clients/${username}-${startTime}`)
        .update({
          themes: fieldValue.arrayUnion(...themesArray),
        });
    } catch (error) {
      console.error("Error on updation themes doc", error);
      return res
        .status(500)
        .send(
          "Internal Server Error on updating themes array on user at provider client list."
        );
    }
  });

  return res.status(200).send("Success on Post Classifying...");
}
