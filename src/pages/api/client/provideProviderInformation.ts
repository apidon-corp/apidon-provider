import { firestore } from "@/firebase/adminApp";
import {
  ActiveProviderInformation,
  ClientDocData,
  RatingsDoc,
} from "@/types/Client";
import { IShowcaseItem } from "@/types/User";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

function handlePreflightRequest(res: NextApiResponse) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.USER_PANEL_BASE_URL as string
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,authorization");
  res.status(200).end();
}

function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to provideFeed API.");
    return false;
  }

  const apiKey = process.env.API_KEY_BETWEEN_SERVICES;
  if (apiKey === undefined) {
    console.error("API_KEY_BETWEEN_SERVICES is undefined");
    return false;
  }

  if (key !== apiKey) {
    console.error("Unauthorized attempt to provideFeed API.");
    return false;
  }

  return true;
}

function validateProps(providerName: string, clientId: string) {
  if (!providerName || !clientId) return false;
  return true;
}

async function getShowcaseData(providerId: string) {
  try {
    const showcaseDocSnapshot = await firestore
      .doc(`/showcase/${providerId}`)
      .get();

    if (!showcaseDocSnapshot.exists) {
      console.error("Showcase doc doesn't exist");
      return false;
    }

    const showcaseDocData = showcaseDocSnapshot.data() as IShowcaseItem;
    if (!showcaseDocData) {
      console.error("Showcase Doc Data is undefined.");
      return false;
    }

    return showcaseDocData;
  } catch (error) {
    console.error("Error while getting client doc data: \n", error);
    return false;
  }
}

async function getClientDocData(providerId: string, clientId: string) {
  try {
    const clientDocSnapshot = await firestore
      .doc(`/users/${providerId}/clients/${clientId}`)
      .get();

    if (!clientDocSnapshot.exists) {
      console.error("Client doc doesn't exist");
      return false;
    }

    const clientDocData = clientDocSnapshot.data() as ClientDocData;
    if (!clientDocData) {
      console.error("Client Doc Data is undefined.");
      return false;
    }

    return clientDocData;
  } catch (error) {
    console.error("Error while getting client doc data: \n", error);
    return false;
  }
}

async function getRatingOfClient(username: string, providerId: string) {
  try {
    const ratingsDocSnapshot = await firestore
      .doc(`/users/${providerId}/clients/ratings`)
      .get();
    if (!ratingsDocSnapshot.exists) {
      console.error("Ratings doc doesn't exist");
      return false;
    }

    const ratingsDocData = ratingsDocSnapshot.data() as RatingsDoc;
    if (!ratingsDocData) {
      console.error("Ratings doc data is undefined.");
      return false;
    }

    const ratings = ratingsDocData.ratings;

    const clientRatingObject = ratings.find((r) => r.username === username);

    return clientRatingObject ? clientRatingObject.rating : 0;
  } catch (error) {
    console.error("Error while getting client rating: \n", error);
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "OPTIONS") return handlePreflightRequest(res);

  const { authorization } = req.headers;
  const { providerName, clientId } = req.body;

  const handleAuthResult = handleAuthorization(authorization);
  if (!handleAuthResult) return res.status(401).send("Unauthorized");

  const validatePropsResult = validateProps(providerName, clientId);
  if (!validatePropsResult)
    return res.status(422).send("Invalid prop or props");

  const getShowcaseDataResult = await getShowcaseData(providerName);
  if (!getShowcaseDataResult)
    return res.status(500).send("Internal Server Error");

  const getClientDocDataResult = await getClientDocData(providerName, clientId);
  if (!getClientDocDataResult)
    return res.status(500).send("Internal Server Error");

  const getRatingOfClientResult =
    (await getRatingOfClient(getClientDocDataResult.username, providerName)) ||
    0;

  const activeProviderInformation: ActiveProviderInformation = {
    clientCount: getShowcaseDataResult.clientCount,
    score:
      getShowcaseDataResult.sumScore / (getShowcaseDataResult.rateCount || 1),
    description: getShowcaseDataResult.description,
    image: getShowcaseDataResult.image,
    name: getShowcaseDataResult.name,
    offer: getShowcaseDataResult.offer,
    startTime: getClientDocDataResult.startTime,
    userScore: getRatingOfClientResult,
  };

  return res.status(200).json({ ...activeProviderInformation });
}
