import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";
import { ModelSettings, TempModelSettings } from "@/types/Model";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { modelPath, inputImageSizes, modelEnvironment, modelExtension } =
    req.body as ModelSettings;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!inputImageSizes || !modelEnvironment || !modelExtension || !modelPath)
    return res.status(422).send("Invalid Prop or Props");

  /**
   * Update modelSettingsTemp doc.
   */

  try {
    await firestore
      .doc(`users/${operationFromUsername}/modelSettings/modelSettingsTemp`)
      .set({
        ...req.body,
      });
  } catch (error) {
    console.error("Error on updating temp model settings doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
