import { firestore } from "@/firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { ModelSettings } from "@/types/Model";

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

  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${operationFromUsername}/bills`)
      .where("active", "==", true)
      .get();
    if (activeBillDocCollection.empty)
      throw new Error("There is no active bill doc.");
    if (activeBillDocCollection.docs.length !== 1)
      throw new Error("There are more then one active bill doc.");
  } catch (error) {
    console.error("Error on getting active bill doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  const activeBillDoc = activeBillDocCollection.docs[0];

  try {
    await activeBillDoc.ref.update({
      integrationStarted: true,
    });
  } catch (error) {
    console.error(
      "Error on updatimg 'activeBill' doc while changing 'integrationStarted' field: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

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

  try {
    await activeBillDoc.ref.update({
      active: false,
    });
  } catch (error) {
    console.error(
      "Error on updating 'activeBill' doc while changing 'active' field to 'false': \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Successfull");
}
