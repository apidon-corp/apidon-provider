import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { algorithm } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername)
    return res.status(401).json({ error: "unauthorized" });

  if (!algorithm)
    return res.status(422).json({ error: "Invalid prop or props" });

  try {
    await firestore.doc(`users/${operationFromUsername}`).update({
      algorithm: algorithm,
    });
  } catch (error) {
    console.error(
      "Error while setting algorithm. (We were updating user doc.",
      error
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  return res.status(200).json({});
}
