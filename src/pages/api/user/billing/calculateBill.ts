import { firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { CalculateBillAPIReponse } from "@/types/Billing";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  let postsLength: number;
  try {
    const postsDoc = await firestore.doc("/posts/posts").get();
    if (!postsDoc.exists) throw new Error("'posts/posts' doc doesn't exist");

    postsLength = (postsDoc.data()?.postsArray as string[]).length;
  } catch (error) {
    console.error("Error while calculating bill: \n", error);
    return res.status(500).send("Internal Server Error");
  }

  const amount = postsLength * 1;

  const response: CalculateBillAPIReponse = {
    amount: amount,
    currency: "dollar",
  };

  return res.status(200).json(response);
}
