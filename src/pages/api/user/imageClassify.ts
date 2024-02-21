import { bucket } from "@/Firebase/adminApp";
import getDisplayName from "@/apiUtils";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
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

  if (!operationFromUsername) return res.status(401).send("unauthorized");

  if (!image) return res.status(422).send("Invalid prop or props");

  if (req.method !== "POST") return res.status(405).send("Method now allowed");

  const file = bucket.file(
    `users/${operationFromUsername}/${Date.now().toString()}`
  );
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
    return res.status(503).send("Firebase Error");
  }

  try {
    await file.makePublic();
  } catch (error) {
    console.error(
      "Error while updating profile photo.(We are on 'making file public')"
    );
    return res.status(503).send("Firebase Error");
  }

  let publicURL = "";
  try {
    publicURL = file.publicUrl();
  } catch (error) {
    console.error("Error while creating public url.", error);
    return res.status(503).send("Firebase Error");
  }

  let response: Response;
  try {
    response = await fetch("http://127.0.0.1:8000/api/imageClassify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageSource: publicURL,
      }),
    });
  } catch (error) {
    console.error(
      "Error while fetching to Python Image Classify API...",
      error
    );
    return res.status(503).send("Internal Server Error");
  }

  if (!response.ok) {
    console.log("There is an error in API side.", await response.text());
    return res.status(503).send("Internal Server Error");
  }

  let responseResult;
  try {
    responseResult = await response.json();
  } catch (error) {
    console.log("There is an error in API side.", await response.text());
    return res.status(503).send("Intenal Server Error");
  }

  const predictions = responseResult.predictions;

  try {
    await file.delete();
  } catch (error) {
    console.error("Error wihle deleting image", error);
    return res.status(503).send("Internal Server Error");
  }

  return res.status(200).json({
    predictions: predictions,
  });
}
