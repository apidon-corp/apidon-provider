import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { offer } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername)
    return res.status(401).json({ error: "unauthorized" });

  if (!offer) return res.status(422).json({ error: "Invalid prop or props" });

  try {
    await firestore.doc(`users/${operationFromUsername}`).update({
      offer: offer,
    });
  } catch (error) {
    console.error(
      "Error while setting offer. (We were updating user doc.",
      error
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  try {
    await firestore.doc(`showcase/${operationFromUsername}`).update({
      offer: offer,
    });
  } catch (error) {
    console.error(
      "Error while setting offer. (We were updating showcase doc.",
      error
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  return res.status(200).json({});
}
