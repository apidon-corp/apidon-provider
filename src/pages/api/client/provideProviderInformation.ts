import { firestore } from "@/Firebase/adminApp";
import { NextApiRequest, NextApiResponse } from "next";

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
  const { providerName } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("unauthorized");

  let providerDocSnapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    providerDocSnapshot = await firestore.doc(`showcase/${providerName}`).get();
  } catch (error) {
    console.error(
      "Error while getting provider information. (We were getting doc)",
      error
    );
    return res.status(503).send("Firebase Error");
  }

  if (!providerDocSnapshot.exists) {
    console.error(`Provider doc of ${providerName} doesn't exist`);
    return res.status(422).send("Invalid Prop or Props");
  }

  const providerInformation = {
    score:
      providerDocSnapshot.data()?.sumScore /
      providerDocSnapshot.data()?.rateCount,
    clientCount: providerDocSnapshot.data()?.clientCount,
    description: providerDocSnapshot.data()?.description,
    image: providerDocSnapshot.data()?.image,
  };

  return res.status(200).json({
    providerInformation: providerInformation,
  });
}
