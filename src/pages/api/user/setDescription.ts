import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { description } = req.body;
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername) return res.status(401).json({ error: "error" });

  if (!description)
    return res.status(422).json({ Error: "Invalid Prop or props" });

  try {
    await firestore.doc(`users/${operationFromUsername}`).update({
      description: description,
    });
  } catch (error) {
    console.error(
      "Error while setting description. (We were updating user doc.)"
    );
    return res.status(503).json({ error: "Firebase Error" });
  }
  try {
    await firestore.doc(`showcase/${operationFromUsername}`).update({
      description: description,
    });
  } catch (error) {
    console.error(
      `Error while setting description. (We were updating showcase doc of ${operationFromUsername}) `
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  return res.status(200).json({});
}
