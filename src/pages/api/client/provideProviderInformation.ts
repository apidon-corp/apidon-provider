import { firestore } from "@/firebase/adminApp";
import { ActiveProviderInformation } from "@/types/Client";
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
  const { providerName, startTime, client } = req.body;

  if (authorization !== process.env.API_KEY_BETWEEN_SERVICES)
    return res.status(401).send("unauthorized");

  if (!providerName || !startTime || !client) {
    return res.status(422).send("Invalid prop or props");
  }

  let createdProviderInformation: ActiveProviderInformation;

  try {
    const clientDoc = await firestore
      .doc(`/users/${providerName}/clients/${client}-${startTime}`)
      .get();

    if (!clientDoc.exists) throw new Error("Client doc doesn't exists.");

    const clientDocData = clientDoc.data();
    if (clientDocData === undefined)
      throw new Error("clientDocData is undefined.");

    const active = clientDocData.active;
    const debt = clientDocData.debt;
    const endTime = clientDocData.endTime;
    const clientScore = clientDocData.score;
    const sStartTime = clientDocData.startTime;
    const withdrawn = clientDocData.withdrawn;

    const showcaseDoc = await firestore.doc(`showcase/${providerName}`).get();
    if (!showcaseDoc.exists) {
      throw new Error("Showcase doc doesn't exist.");
    }

    const showcaseDocData = showcaseDoc.data();
    if (showcaseDocData === undefined)
      throw new Error("showcaseDocData is undefined");

    const clientCount = showcaseDocData.clientCount;
    const description = showcaseDocData.description;
    const image = showcaseDocData.image;
    const name = showcaseDocData.name;
    const rateCount = showcaseDocData.rateCount;
    const sumScore = showcaseDocData.sumScore;

    const dueDatePassed = Date.now() >= endTime;
    const score = rateCount === 0 ? 0 : sumScore / rateCount;

    createdProviderInformation = {
      isThereActiveProvider: active, // true for this API
      providerData: {
        withdrawn: withdrawn,
        dueDatePassed: dueDatePassed,
        additionalProviderData: {
          clientCount: clientCount,
          description: description,
          image: image,
          duration: {
            endTime: endTime,
            startTime: sStartTime,
          },
          name: name,
          score: score,
          userScore: clientScore,
          yield: debt,
        },
      },
    };

    return res.status(200).json({ ...createdProviderInformation });
  } catch (error) {
    console.error(
      "Error while creating provider information for client: \n",
      error
    );
    return res.status(500).send("Internal Server Error");
  }
}
