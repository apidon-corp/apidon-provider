import { firestore } from "@/firebase/adminApp";
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
  const { authorization } = req.headers;
  const { offer } = req.body;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!offer) return res.status(422).send("Invalid Prop or Props");

  try {
    await firestore.doc(`users/${operationFromUsername}`).update({
      offer: offer,
    });
  } catch (error) {
    console.error(
      "Error while setting offer. (We were updating user doc.",
      error
    );
    return res.status(503).send("Firebase Error");
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
    return res.status(503).send("Firebase Error");
  }

  return res.status(200).send("Success");
}
