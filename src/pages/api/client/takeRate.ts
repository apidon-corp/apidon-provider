import { fieldValue, firestore } from "@/Firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * To handle cors policy...
   */
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;
  const { username, provider, score } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).json({ error: "unauthorized" });

  if (!username || !provider || !score) {
    return res.status(422).json({ error: "Invalid prop or props" });
  }

  // get client doc...

  let clientDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    clientDoc = await firestore
      .doc(`users/${provider}/clients/${username}`)
      .get();
  } catch (error) {
    console.error("Error while rating. (We were getting client doc", error);
    return res.status(503).json({ error: "Firebase Error" });
  }

  const scoreUserGaveBefore = clientDoc.data()?.score;

  const hasUserGivenScoreBefore: boolean = scoreUserGaveBefore ? true : false;

  // update client doc

  try {
    await clientDoc.ref.update({
      score: score,
    });
  } catch (error) {
    console.error(
      "Error while taking rate. (We were updating client doc",
      error
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  // update showcase
  try {
    await firestore.doc(`showcase/${provider}`).update({
      rateCount: fieldValue.increment(hasUserGivenScoreBefore ? 0 : 1),
      sumScore: fieldValue.increment(
        hasUserGivenScoreBefore ? score - scoreUserGaveBefore : score
      ),
    });
  } catch (error) {
    console.error("Error while updating score . (We were updating showcase)");
    return res.status(503).json({ error: "Firebase Error" });
  }

  // update provider doc
  try {
    await firestore.doc(`users/${provider}`).update({
      rateCount: fieldValue.increment(hasUserGivenScoreBefore ? 0 : 1),
      sumScore: fieldValue.increment(
        hasUserGivenScoreBefore ? score - scoreUserGaveBefore : score
      ),
    });
  } catch (error) {
    console.error(
      "Error while taking score. (We were updating provider doc)",
      error
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  return res.status(200).json({});
}
