import { firestore } from "@/firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { CalculateBillAPIReponse } from "@/types/Billing";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 120,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * To handle cors policy...
   */
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.NEXT_PUBLIC_ALLOW_CORS_ADDRESS as string
  );
  res.setHeader("Access-Control-Allow-Headers", "authorization,AKBAPA");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;
  const { akbapa } = req.headers;

  if (akbapa) {
    if (akbapa !== process.env.API_KEY_BETWEEN_APIDON_PROVIDER_APIS)
      return res
        .status(401)
        .send("Key between apidon provider API's is false.");
  } else {
    const operationFromUsername = await getDisplayName(authorization as string);
    if (!operationFromUsername) return res.status(401).send("unauthorized");
  }

  let postsLength: number;
  try {
    const postsDoc = await firestore.doc("/posts/posts").get();
    if (!postsDoc.exists) throw new Error("'posts/posts' doc doesn't exist");

    postsLength = (postsDoc.data()?.postsArray as string[]).length;
  } catch (error) {
    console.error("Error while calculating bill: \n", error);
    return res.status(500).send("Internal Server Error");
  }
  const pricePerPost = 0.01;
  const totalPrice = postsLength * pricePerPost;

  const response: CalculateBillAPIReponse = {
    totalPrice: totalPrice,
    currency: "dollar",
    postCount: postsLength,
    pricePerPost: pricePerPost,
  };

  return res.status(200).json(response);
}
