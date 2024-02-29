import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import {
  CalculateBillAPIReponse,
  CreatePaymentRuleAPIRequestBody,
  CreatePaymentRuleAPIResponse,
  PaymentRuleInServer,
} from "@/types/Billing";
import { ethers } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const requestBody = req.body as CreatePaymentRuleAPIRequestBody;

  if (!authorization || !requestBody.payerAddress)
    return res.status(422).send("Invalid Prop or Props");

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  const payerAddress = requestBody.payerAddress;

  const payerAddressValidationStatus = ethers.isAddress(payerAddress);
  if (!payerAddressValidationStatus)
    return res.status(422).send("Payer Address is not a payable address.");

  /**
   * Check If there is an already active bill doc.
   */

  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${operationFromUsername}/bills`)
      .where("active", "==", true)
      .get();
    if (!activeBillDocCollection.empty)
      throw new Error("There is already an active bill doc.");
  } catch (error) {
    console.error(
      "Error on checking active bill doc count before creating new bill doc: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }

  /**
   * Calculate again the price...
   * Create Document... and get its Id
   * Firebase
   *  - Store 'paymentRule' object on /users/[providerId]/bills/[documentId](auto-generated)`.
   * Blockchain
   *  - Create new payment rule.
   */

  let price: number;
  try {
    const response = await fetch(
      `${process.env.PROVIDER_ROOT_ADDRESS_URL}/api/user/billing/calculateBill`,
      {
        method: "GET",
        headers: {
          akbapa: process.env.API_KEY_BETWEEN_APIDON_PROVIDER_APIS as string,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Response from 'calculateBill' API is not okay.");
    }

    const calculateBillGoodReponse: CalculateBillAPIReponse =
      await response.json();

    price = calculateBillGoodReponse.totalPrice;
  } catch (error) {
    console.error("Error while fetching to 'calculateBill' API.", error);
    return res.status(500).send("Internal Server Error");
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  let paymentRule: PaymentRuleInServer = {
    active: true,
    price: price,
    due: now + oneDay,
    id: "",
    occured: false,
    payer: payerAddress,
  };

  let createdDocRef;
  try {
    const createdPaymentRuleDoc = await firestore
      .collection(`/users/${operationFromUsername}/bills`)
      .add({ ...paymentRule });
    createdDocRef = createdPaymentRuleDoc;
  } catch (error) {
    console.error("Error while creating 'paymentRule' doc: \n", error);
    return res.status(500).send("Internal server error");
  }

  const id = `${operationFromUsername}-${createdDocRef.id}`;

  paymentRule = {
    ...paymentRule,
    id: id,
  };

  try {
    await createdDocRef.set({
      ...paymentRule,
    });
  } catch (error) {
    console.error("Error while updating 'ruleDoc': \n", error);
    return res.status(500).send("Internal Server Error");
  }

  const response: CreatePaymentRuleAPIResponse = {
    ...paymentRule,
  };

  return res.status(200).json({ ...response });
}
