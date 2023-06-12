import { firestore } from "@/Firebase/adminApp";
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
    console.error("Error while getting providerDocSnapshot", error);
    return res.status(503).json({ error: "Firebase Error" });
  }

  if (!providerDocSnapshot.exists)
    return res.status(422).json({ error: "Invalid Proivder Name" });

  // const algorithm = providerDocSnapshot.data()?.algorithm;

  // if (!algorithm)
  //   return res
  //     .status(500)
  //     .json({ error: `${provider} has no algorithm in it self` });

  // let algorithmJSON: { mode: string };
  // try {
  //   algorithmJSON = JSON.parse(algorithm);
  // } catch (error) {
  //   console.error("Error while parsing algorithm as JSON.", error);
  //   return res
  //     .status(500)
  //     .json({ error: "Algorithm couldn't be parsed as JSON" });
  // }

  // const algorithmMode = algorithmJSON.mode;

  let postDocPathArray: string[] = [];
  if (provider === "SmartFeed") {
    postDocPathArray = [
      "users/savranyagizefe/posts/06c3c8c5489243e69ac01563082a6896",
      "users/merenoz/posts/e886faa8d67e44d5a711b5895349e3a0",
      "users/merenoz/posts/fcd23216569e4f3480a066bb0426d028",
      "users/eob/posts/abccd45c21624a649671b2334fabf42d",
      "users/savranyagizefe/posts/35803858eaa94ce6aa897555d3907fe1",
    ];
  } else if (provider === "AdBoost") {
    postDocPathArray = [
      "users/merenoz/posts/fcd23216569e4f3480a066bb0426d028",
      "users/savranyagizefe/posts/f753afaf4f6a45a186b439eddd3f7736",
      "users/eob/posts/ddc5fec27f96403f87dee48817105bc2",
      "users/eob/posts/c4fd104e7ea9483e9887eb43de5724a1",
      "users/merenoz/posts/1d4f4f06cd6944c0a1a50d266f8cc3b9",
    ];
  } else if (provider === "ArtisticArea") {
    postDocPathArray = [
      "users/savranyagizefe/posts/75fc3c3f0fdd4b1dae3fd21b126e82c5",
      "users/merenoz/posts/895afc30d2fb449c9975b95aea594a0a",
      "users/merenoz/posts/465a1a6f7bb546209ec5002db74a4b83",
      "users/eob/posts/78b6afdf767d4cd99a79254f9e1ed98b",
      "users/savranyagizefe/posts/478cec1f3e964f818677b9371ace5a2e",
    ];
  }

  return res.status(200).json({
    postDocPathArray: postDocPathArray,
    adObjectArray: [],
  });
}
