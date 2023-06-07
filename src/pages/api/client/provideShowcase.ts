import { firestore } from "@/Firebase/adminApp";
import { IShowcaseItem } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  /**
   * To handle cors policy...
   */
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    // Respond with a 200 OK status code
    res.status(200).end();
    return;
  }

  const { authorization } = req.headers;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).json({ error: "unauthorized" });

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
    return res.status(503).json({ error: "Firebase Error" });
  }

  if (providersShowcaseCollectionSnapshot.size === 0) {
    console.error(
      "Error while creating providersShowCollection. There is no document."
    );
    return res.status(503).json({ error: "Internal Server Error" });
  }
  let providersShowcaseDatas: IShowcaseItem[] = [];
  for (const proivderDoc of providersShowcaseCollectionSnapshot.docs) {
    providersShowcaseDatas.push(proivderDoc.data() as IShowcaseItem);
  }

  console.log(providersShowcaseDatas);

  return res.status(200).json({
    providersShowcaseDatas: providersShowcaseDatas,
  });
}
