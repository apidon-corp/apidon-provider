import { auth, firestore } from "@/Firebase/adminApp";
import { IShowcaseItem, UserInServer } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res
    .status(500)
    .send("New provider registration is disabled, temporarily.");

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
    return res.status(503).send("Internal Server Error");
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
    return res.status(503).send("Firebase Error");
  }

  try {
    await firestore.doc(`users/${providerName}/postThemes/postThemes`).set({
      postThemesArray: [],
    });
  } catch (error) {
    console.error(
      "Error on creation of provider. (We were creating postThemes/postThemes Doc for it.)",
      error
    );
    return res.status(503).send("Firebase Error");
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
    return res.status(503).send("Firebase Error");
  }

  return res
    .status(200)
    .json({ createdProviderInformation: createdProviderInformation });
}
