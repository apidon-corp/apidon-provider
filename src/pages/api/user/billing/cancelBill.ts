import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  const providerId = operationFromUsername;

  /**
   * Due one provider has only one active bill, we can find and cancel it.
   */

  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${providerId}/bills`)
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
      active: false,
    });
  } catch (error) {
    console.error(
      "Error on making 'active' field of 'billDoc' to 'false': \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  return res.status(200).send("Success");
}
