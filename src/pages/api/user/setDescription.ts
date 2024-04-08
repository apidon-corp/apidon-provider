import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { description } = req.body;
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername) return res.status(401).send("unauthenticated");

  if (!description) return res.status(422).send("Invalid Prop or Props");

  try {
    await firestore.doc(`users/${operationFromUsername}`).update({
      description: description,
    });
  } catch (error) {
    console.error(
      "Error while setting description. (We were updating user doc.)"
    );
    return res.status(503).send("Firebase Error");
  }
  try {
    await firestore.doc(`showcase/${operationFromUsername}`).update({
      description: description,
    });
  } catch (error) {
    console.error(
      `Error while setting description. (We were updating showcase doc of ${operationFromUsername}) `
    );
    return res.status(503).send("Firebase Error");
  }

  return res.status(200).send("Success");
}
