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
    console.log(req.body);
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

  // process algorithm.......and result is

  const postDocPathArray: string[] = [
    "users/test/posts/79ba43ae57af46739bc1d49108439556",
    "users/test/posts/be38a12d069a4aac96bdc62b4b8f172f",
    "users/test/posts/ca0c5a192c594ee588632e511f4900fa",
  ];

  return res.status(200).json({
    postDocPathArray: postDocPathArray,
    adObjectArray: [],
  });
}
