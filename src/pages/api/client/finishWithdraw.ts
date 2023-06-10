import { fieldValue, firestore } from "@/Firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * To handle cors policy...
   */
  res.setHeader("Access-Control-Allow-Origin", "https://blocksocial.vercel.app");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;
  const { username, provider, startTime } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).json({ error: "unauthorized" });

  if (!username || !provider || !startTime) {
    return res.status(422).json({ error: "Invalid prop or props" });
  }

  try {
    await firestore
      .doc(`users/${provider}/clients/${username}-${startTime}`)
      .update({
        active: false,
        withdrawn: true,
      });
  } catch (error) {
    console.error(
      "Error on finish withdraw. (We were updating client doc)",
      error
    );
    return res.status(503).json({ error: "Firebase-Error" });
  }

  try {
    await firestore.doc(`users/${provider}`).update({
      clientCount: fieldValue.increment(-1),
    });
  } catch (error) {
    console.error(
      "Error on finish withdraw. (We were updating provider doc to decrease client count)",
      error
    );
    return res.status(503).json({ error: "Firebase-Error" });
  }

  try {
    await firestore.doc(`showcase/${provider}`).update({
      clientCount: fieldValue.increment(-1),
    });
  } catch (error) {
    console.error(
      "Error on finish withdraw. (We were updating showcase doc to decrease client count",
      error
    );
    return res.status(503).json({ error: "Firebase-Error" });
  }

  return res.status(200).json({});
}
