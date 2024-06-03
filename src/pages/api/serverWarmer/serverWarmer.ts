import { NextApiRequest, NextApiResponse } from "next";

const handleAuthorization = (authorization: string | undefined) => {
  if (!authorization) return false;

  const apiKey = process.env.SERVER_WARMER_KEY;
  if (!apiKey) return;

  return authorization === apiKey;
};

async function handleSendRequest(
  root: string,
  apiKey: string,
  baseURL: string
) {
  const totalEndpoint = `${baseURL}${root}`;

  try {
    const response = await fetch(totalEndpoint, {
      headers: {
        "Content-Type": "application/json",
        serverwarmerkey: apiKey,
      },
    });

    if (!response.ok) {
      console.error(
        `Error on warming path: ${totalEndpoint}`,
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error on warming path: ${totalEndpoint}`, error);
    return false;
  }
}

async function executeRequests(roots: string[]) {
  const apiKey = process.env.SERVER_WARMER_KEY;
  if (!apiKey) {
    console.error("Error on getting server warmer key.");
    return false;
  }

  const baseURL = process.env.PROVIDER_ROOT_ADDRESS_URL;
  if (!baseURL) {
    console.error("Error on getting provider panel base url.");
    return false;
  }

  const results = await Promise.all(
    roots.map((root) => handleSendRequest(root, apiKey, baseURL))
  );

  if (results.includes(false)) {
    console.error("One or more result is not okay in results.");
    return false;
  }

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { authorization } = req.headers;

  const isAuthorized = handleAuthorization(authorization as string);
  if (!isAuthorized) return res.status(401).send("Unauthorized");

  const rootes = ["/api/client/provideFeed"];

  const executeReult = await executeRequests(rootes);
  if (!executeReult) return res.status(500).send("Internal Server Error");

  return res.status(200).send("OK");
}
