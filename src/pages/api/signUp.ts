import { auth, firestore } from "@/Firebase/adminApp";
import { UserInServer } from "@/types/User";
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
    currency: "",
    description: "",
    email: email,
    image: "",
    name: providerName,
    price: -1,
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

  return res
    .status(200)
    .json({ createdProviderInformation: createdProviderInformation });
}
