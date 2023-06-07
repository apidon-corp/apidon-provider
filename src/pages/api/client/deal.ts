import { fieldValue, firestore } from "@/Firebase/adminApp";
import { IDealResult } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;
  const { username, provider } = req.body;

  if (authorization !== process.env.NEXT_PUBLIC_API_KEY_BETWEEN_SERVICES)
    return res.status(401).json({ error: "unauthorized" });

  if (!username || !provider) {
    return res.status(422).json({ error: "Invalid prop or props" });
  }

  let providerDocSnapshot: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  try {
    providerDocSnapshot = await firestore.doc(`users/${provider}`).get();
  } catch (error) {
    console.error("Error while deal. (We were getting provider doc snapshot");
    return res.status(503).json({ error: "Firebase Error" });
  }

  if (!providerDocSnapshot.exists)
    return res.status(422).json({ error: "Invalid Provider name" });

  try {
    await providerDocSnapshot.ref.update({
      clientCount: fieldValue.increment(1),
      revenue: fieldValue.increment(providerDocSnapshot.data()?.offer * 1.1),
    });
  } catch (error) {
    console.error("error while deal. (We were updating provider doc.");
    return res.status(503).json({ error: "Firebase Error" });
  }
  try {
    await firestore.doc(`showcase/${provider}`).update({
      clientCount: fieldValue.increment(1),
    });
  } catch (error) {
    console.error(
      `error while deal. (We were updating showcase doc for: ${provider}`
    );
    return res.status(503).json({ error: "Firebase Error" });
  }
  const currentTimeStamp = Date.now();
  const dealResultObject: IDealResult = {
    name: provider,
    startTime: currentTimeStamp,
    endTime: currentTimeStamp + 30 * 24 * 60 * 60 * 1000,
    yield: providerDocSnapshot.data()?.offer,
  };

  let clientObject = {
    active: true,
    endTime: currentTimeStamp + 30 * 24 * 60 * 60 * 1000,
    score: 0,
    startTime: currentTimeStamp,
    debt: providerDocSnapshot.data()?.offer,
  };

  try {
    await firestore
      .doc(`users/${provider}/clients/${username}`)
      .set(clientObject);
  } catch (error) {
    console.error("Error while deal. We were adding client doc.");
    return res.status(503).json({ error: "Firebase Error" });
  }

  return res.status(200).json({ dealResult: dealResultObject });
}
