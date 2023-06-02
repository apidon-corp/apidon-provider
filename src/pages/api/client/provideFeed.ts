import { firestore } from "@/Firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { username, provider } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).json({ error: "unauthorized" });

  if (!username || !provider) {
    return res.status(422).json({ error: "Invalid prop or props" });
  }

  let providerDocSnapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    providerDocSnapshot = await firestore.doc(`users/${provider}`).get();
  } catch (error) {
    console.error("Error while getting providerDocSnapshot", error);
    return res.status(503).json({ error: "Firebase Error" });
  }

  if (!providerDocSnapshot.exists)
    return res.status(422).json({ error: "Invalid Proivder Name" });

  const algorithm = providerDocSnapshot.data()?.algorithm;

  if (!algorithm)
    return res
      .status(500)
      .json({ error: `${provider} has no algorithm in it self` });

  let algorithmJSON: { mode: string };
  try {
    algorithmJSON = JSON.parse(algorithm);
  } catch (error) {
    console.error("Error while parsing algorithm as JSON.", error);
    return res
      .status(500)
      .json({ error: "Algorithm couldn't be parsed as JSON" });
  }

  const algorithmMode = algorithmJSON.mode;

  let postDocPathArray: string[] = [];
  if (algorithmMode === "fun") {
    postDocPathArray = [
      "users/cringememes/posts/9762879caf1d46aaa837602a218b8c84",
    ];
  } else if (algorithmMode === "serious") {
    postDocPathArray = [
      "users/voiceofrize/posts/3ef548095acd43749fdbd288d2afed1f",
    ];
  }

  return res.status(200).json({
    postDocPathArray: postDocPathArray,
    adObjectArray: [],
  });
}
