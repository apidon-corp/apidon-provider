import { auth, firestore } from "@/Firebase/adminApp";
import { IShowcaseItem, UserInServer } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email, password, providerName } = req.body;

  let uidCreated = "";
  try {
    const { uid } = await auth.createUser({
      email: email,
      password: password,
      displayName: providerName,
    });
    uidCreated = uid;
  } catch (error) {
    console.error("Error while creating user. (We were creating user.)", error);
    return res.status(503).json({ error: "error" });
  }

  const createdProviderInformation: UserInServer = {
    description: "",
    email: email,
    image: "",
    name: providerName,
    clientCount: 0,

    revenue: 0,
    offer: 0,

    sumScore: 0,
    rateCount: 0,

    algorithm: "",
    uid: uidCreated,
  };

  try {
    await firestore.doc(`users/${providerName}`).set({
      ...createdProviderInformation,
    });
  } catch (error) {
    console.error(
      "Error while creating provider. (We were creating doc for it.)",
      error
    );
    return res.status(503).json({ error: "error" });
  }

  try {
    const newShowcaseItemObject: IShowcaseItem = {
      name: providerName,
      description: "",
      image: "",

      clientCount: 0,

      rateCount: 0,
      sumScore: 0,

      offer: 0,
    };
    await firestore
      .doc(`showcase/${providerName}`)
      .set({ ...newShowcaseItemObject });
  } catch (error) {
    console.error(
      "Error while sign up. (We were creating showcase doc.)",
      error
    );
    return res.status(503).json({ error: "Firebase Error" });
  }

  return res
    .status(200)
    .json({ createdProviderInformation: createdProviderInformation });
}
