import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { ModelSettings } from "@/types/Model";

import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const modelSettings = req.body.modelSettings as ModelSettings;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername)
    return res.status(401).json({ error: "unauthorized" });

  if (
    !modelSettings.inputImageSizes ||
    !modelSettings.modelEnvironment ||
    !modelSettings.modelExtension ||
    !modelSettings.modelPath
  )
    return res.status(401).send("Invalid Prop or Props");

  try {
    await firestore
      .doc(`users/${operationFromUsername}/modelSettings/modelSettings`)
      .set({
        ...modelSettings,
      });
  } catch (error) {
    console.error(
      "Error on modelChangeAPI: We're setting 'modelSettings' doc",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Successfull");
}
