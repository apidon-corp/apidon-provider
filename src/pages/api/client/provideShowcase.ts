import { firestore } from "@/Firebase/adminApp";
import { IShowcaseItem, ShowCaseItem } from "@/types/User";
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

  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("Unauthorized");

  let providersShowcaseCollectionSnapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
  try {
    providersShowcaseCollectionSnapshot = await firestore
      .collection("showcase")
      .get();
  } catch (error) {
    console.error(
      "Error while creating providersShowCollection. (We were getting provider collection showcase)",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  if (providersShowcaseCollectionSnapshot.size === 0) {
    console.error(
      "Error while creating providersShowCollection. There is no document."
    );
    return res.status(503).send("Internal Server Error");
  }
  let providersShowcaseDatas: ShowCaseItem[] = [];
  for (const providerDoc of providersShowcaseCollectionSnapshot.docs) {
    const providerDocData = providerDoc.data() as IShowcaseItem;

    const showcaseObject: ShowCaseItem = {
      clientCount: providerDocData.clientCount,
      description: providerDocData.description,
      image: providerDocData.image,
      name: providerDocData.name,
      offer: providerDocData.offer,
      score:
        providerDocData.rateCount === 0
          ? 0
          : providerDocData.sumScore / providerDocData.rateCount,
    };

    providersShowcaseDatas.push(showcaseObject);
  }

  return res.status(200).json({
    providersShowcaseDatas: providersShowcaseDatas,
  });
}
