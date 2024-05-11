import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";
import { ModelSettings } from "@/types/Model";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  // Destructure required properties from req.body
  const {
    modelPath,
    inputImageSizes,
    modelEnvironment,
    modelExtension,
    labelPath,
  } = req.body as ModelSettings;

  // Check if authorization header exists
  if (!authorization) return res.status(401).send("Unauthorized");

  // Get operationFromUsername using authorization
  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("Unauthorized");

  // Check if all required properties exist in req.body
  if (
    !inputImageSizes ||
    !modelEnvironment ||
    !modelExtension ||
    !modelPath ||
    !labelPath
  ) {
    return res.status(422).send("Invalid Prop or Props");
  }

  try {
    // Update modelSettingsTemp doc
    await firestore
      .doc(`users/${operationFromUsername}/modelSettings/modelSettingsTemp`)
      .set(req.body);
  } catch (error) {
    console.error("Error on updating temp model settings doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
