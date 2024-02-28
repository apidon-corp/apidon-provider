import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import {
  CheckPaymentRuleAPIRequestBody,
  CheckPaymentRuleAPIResponse,
  PaymentRuleInServer,
} from "@/types/Billing";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqBody = req.body as CheckPaymentRuleAPIRequestBody;
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!reqBody.providerId) return res.status(422).send("Invalid Prop or Props");

  let response: CheckPaymentRuleAPIResponse;

  const providerId = reqBody.providerId;
  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${providerId}/bills`)
      .where("active", "==", true)
      .get();
  } catch (error) {
    console.error("Error on getting active bill doc: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  if (activeBillDocCollection.empty) {
    response = {
      occured: false,
      thereIsNoActivePaymentRule: true,
    };
    return res.status(200).json(response);
  }

  if (activeBillDocCollection.docs.length !== 1) {
    console.error("User has more than one active billing");
    return res.status(500).send("Internal Server Error");
  }

  const activeBillDocData =
    activeBillDocCollection.docs[0].data() as PaymentRuleInServer;

  const occured = activeBillDocData.occured;

  response = {
    occured: occured,
    thereIsNoActivePaymentRule: false,
  };

  return res.status(200).json(response);
}