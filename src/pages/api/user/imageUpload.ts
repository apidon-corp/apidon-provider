import { bucket, firestore } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { image } = req.body;
  const { authorization } = req.headers;

  const operationFromUsername = await getDisplayName(authorization as string);

  if (!operationFromUsername)
    return res.status(401).json({ error: "unAuthorized" });

  if (!image) return res.status(422).json({ error: "Invalid prop or props" });

  if (req.method !== "POST")
    return res.status(405).json({ error: "method not allowed" });

  const file = bucket.file(`users/${operationFromUsername}/image`);
  const buffer = Buffer.from(image.split(",")[1], "base64");

  try {
    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });
    await file.setMetadata({
      cacheControl: "public, max-age=1",
    });
  } catch (error) {
    console.error(
      "Error while updating profile photo. (We are on 'file saving'.)",
      error
    );
    return res.status(503).json({ error: "Firebase error" });
  }

  try {
    await file.makePublic();
  } catch (error) {
    console.error(
      "Error while updating profile photo.(We are on 'making file public')"
    );
    return res.status(503).json({ error: "Firebase error" });
  }

  let publicURL = "";
  try {
    publicURL = file.publicUrl();
    await firestore.doc(`users/${operationFromUsername}`).update({
      image: publicURL,
    });
  } catch (error) {
    console.error(
      "Error while updating post.(Process were on updating doc.)",
      error
    );
    return res.status(503).json({ error: "Firebase error" });
  }

  try {
    await firestore.doc(`showcase/${operationFromUsername}`).update({
      image: publicURL,
    });
  } catch (error) {
    console.error(
      "Error while setting image upload. (We were updating showcase)",
      error
    );

    return res.status(503).json({ error: "Firebase error" });
  }

  return res.status(200).json({
    newProfilePhotoURL: publicURL,
  });
}
