import { fieldValue, firestore } from "@/firebase/adminApp";
import { Rating, RatingsDoc } from "@/types/Client";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 60,
};

/**
 * Handling cors policy stuff.
 * @param res
 */
function handlePreflightRequest(res: NextApiResponse) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.NEXT_PUBLIC_ALLOW_CORS_ADDRESS as string
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

function validateProps(username: string, providerId: string, score: number) {
  if (!username || !providerId || !score) {
    console.error("Invalid Props");
    return false;
  }

  return true;
}

async function updateRatingsDoc(
  username: string,
  providerId: string,
  rating: number
) {
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

    if (!ratings) {
      console.error("Ratings (array-field) is undefined.");
      return false;
    }

    const existingRateObject = ratings.find((r) => r.username === username);

    const newRatingObject: Rating = {
      rating: rating,
      username: username,
    };

    if (existingRateObject)
      await ratingsDocSnapshot.ref.update({
        ratings: fieldValue.arrayRemove(existingRateObject),
      });

    await ratingsDocSnapshot.ref.update({
      ratings: fieldValue.arrayUnion(newRatingObject),
    });

    return {
      oldScore: existingRateObject ? existingRateObject.rating : undefined,
    };
  } catch (error) {
    console.error(
      `Error while updating ratings doc. (We were updating ratings doc for: ${username})`,
      error
    );
    return false;
  }
}

async function updateShowcase(
  providerId: string,
  score: number,
  oldScore?: number
) {
  try {
    const showcaseDocRef = firestore.doc(`/showcase/${providerId}`);

    await showcaseDocRef.update({
      rateCount: fieldValue.increment(oldScore ? 0 : 1),
      sumScore: fieldValue.increment(score - (oldScore ? oldScore : 0)),
    });

    return true;
  } catch (error) {
    console.error(
      "Error while updating showcase. (We were updating showcase)",
      error
    );
    return false;
  }
}

async function updateProviderDoc(
  providerId: string,
  score: number,
  oldScore?: number
) {
  try {
    const providerDocRef = firestore.doc(`/users/${providerId}`);

    await providerDocRef.update({
      rateCount: fieldValue.increment(oldScore ? 0 : 1),
      sumScore: fieldValue.increment(score - (oldScore ? oldScore : 0)),
    });

    return true;
  } catch (error) {
    console.error(
      "Error while updating provider doc. (We were updating provider doc)",
      error
    );
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "OPTIONS") return handlePreflightRequest(res);

  const { authorization } = req.headers;
  const { username, provider, score } = req.body;

  const handleAuthResult = handleAuthorization(authorization);
  if (!handleAuthResult) return res.status(401).send("Unauthorized");

  const validatePropsResult = validateProps(username, provider, score);
  if (!validatePropsResult) return res.status(422).send("Invalid Props");

  const updateRatingsDocResult = await updateRatingsDoc(
    username,
    provider,
    score
  );
  if (!updateRatingsDocResult)
    return res.status(500).send("Internal Server Error");

  const updateShowcaseResult = await updateShowcase(
    provider,
    score,
    updateRatingsDocResult.oldScore
  );
  if (!updateShowcaseResult)
    return res.status(500).send("Internal Server Error");

  const updateProviderDocResult = await updateProviderDoc(
    provider,
    score,
    updateRatingsDocResult.oldScore
  );
  if (!updateProviderDocResult)
    return res.status(500).send("Internal Server Error");

  return res.status(200).send("Success");
}
