import getDisplayName from "@/apiUtils";
import { bucket, firestore } from "@/firebase/adminApp";
import {
  Post,
  PostPredictionObject,
  PostServerData,
  PostThemeObject,
} from "@/types/Classification";
import { ModelSettings } from "@/types/Model";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  runtime: "nodejs",
  maxDuration: 300,
};

async function handleAuthorization(key: string | undefined) {
  if (key === undefined) {
    console.error("Unauthorized attemp to integrateModel API.");
    return false;
  }

  const operationFromUsername = await getDisplayName(key);
  if (!operationFromUsername) return false;

  return operationFromUsername;
}

async function updateBillDocOnIntegrationStart(username: string) {
  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${username}/bills`)
      .where("active", "==", true)
      .get();
    if (activeBillDocCollection.empty)
      throw new Error("There is no active bill doc.");
    if (activeBillDocCollection.docs.length !== 1)
      throw new Error("There are more then one active bill doc.");
  } catch (error) {
    console.error("Error on getting active bill doc: \n", error);
    return false;
  }

  const activeBillDoc = activeBillDocCollection.docs[0];
  try {
    await activeBillDoc.ref.update({
      integrationStarted: true,
    });
  } catch (error) {
    console.error(
      "Error on updatimg 'activeBill' doc while changing 'integrationStarted' field: \n",
      error
    );
    return false;
  }

  return true;
}

async function getTempModelSettingsData(username: string) {
  let modelSettingsTempSnapshot;
  try {
    modelSettingsTempSnapshot = await firestore
      .doc(`users/${username}/modelSettings/modelSettingsTemp`)
      .get();
    if (!modelSettingsTempSnapshot.exists) {
      console.error(
        "modelSettingsTemp doc doesn't exists in provider database."
      );
      return false;
    }
  } catch (error) {
    console.error("Error on getting modelSettingsTemp doc: \n", error);
    return false;
  }

  const modelSettingsData = modelSettingsTempSnapshot.data();
  if (modelSettingsData === undefined) {
    console.error("modelSettingsTemp doc data is undefined.");
    return false;
  }

  return modelSettingsData as ModelSettings;
}

async function updateModelFileWithTempOne(username: string, extension: string) {
  try {
    const tempFile = bucket.file(
      `users/${username}/model/temp/model.${extension}`
    );
    await tempFile.move(`users/${username}/model/model.${extension}`);

    const movedFile = bucket.file(`users/${username}/model/model.${extension}`);
    await movedFile.makePublic();
    const modelFileURL = movedFile.publicUrl();

    return modelFileURL;
  } catch (error) {
    console.error(
      "Error on moving temp model and creating new link for that file: \n",
      error
    );
    return false;
  }
}

async function updateLabelFileWithTempOne(username: string) {
  try {
    const tempFile = bucket.file(`users/${username}/model/temp/label.json`);
    await tempFile.move(`users/${username}/model/label.json`);

    const movedFile = bucket.file(`users/${username}/model/label.json`);
    await movedFile.makePublic();
    const labelFileURL = movedFile.publicUrl();

    return labelFileURL;
  } catch (error) {
    console.error(
      "Error on moving temp model and creating new link for that file: \n",
      error
    );
    return false;
  }
}

async function uploadModelToPythonAPIs(
  modelPath: string,
  modelURL: string,
  labelURL: string
) {
  const apiKey = process.env.PYTHON_API_KEY_V2;
  if (!apiKey) {
    console.error("API key is undefined for uploading model to python api.");
    return false;
  }

  const apiEndpoint = process.env.PYTHON_MODEL_UPLOAD_API_ENDPOINT_V2;
  if (!apiEndpoint) {
    console.error(
      "API endpoint is undefined for uploading model to python api."
    );
    return false;
  }

  const formData = new FormData();

  formData.append("path", modelPath);
  formData.append("url", modelURL);
  formData.append("label_url", labelURL);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        authorization: apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error(
        "Response from Python Model Upload API is not okay: \n",
        await response.text()
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error on uploading model to python api: \n", error);
    return false;
  }
}

async function updateModelSettingsDoc(
  username: string,
  modelFileURL: string,
  labelFileURL: string,
  tempModelSettingsData: ModelSettings
) {
  const modelSettingsServer: ModelSettings = {
    inputImageSizes: tempModelSettingsData.inputImageSizes,
    modelEnvironment: tempModelSettingsData.modelEnvironment,
    modelExtension: tempModelSettingsData.modelExtension,
    modelPath: modelFileURL,
    labelPath: labelFileURL,
  };
  try {
    await firestore
      .doc(`/users/${username}/modelSettings/modelSettings`)
      .set({ ...modelSettingsServer });
  } catch (error) {
    console.error("Error on updating model settings doc: \n", error);
    return false;
  }

  return true;
}

async function getAllPostsFromServer() {
  try {
    const postsDoc = await firestore.doc("posts/posts").get();

    if (!postsDoc.exists) {
      console.error("posts/posts doc doesn't exists in provider database.");
      return false;
    }

    const postsDocData = postsDoc.data();

    if (postsDocData === undefined) {
      console.error("posts/posts doc data is undefined.");
      return false;
    }

    const postsArrayFetched = postsDocData.postsArray as Post[];

    if (!postsArrayFetched || postsArrayFetched === undefined) {
      console.error("postsArray is undefined or null.");
      return false;
    }

    return postsArrayFetched;
  } catch (error) {
    console.error("Error on getting postsArray array: \n", error);
    return false;
  }
}

async function getPostInformationFromUserSide(postDocPath: string) {
  const providePostInformationEndpoint =
    process.env.PROVIDE_POST_INFORMATION_ENDPOINT;

  if (
    !providePostInformationEndpoint ||
    providePostInformationEndpoint === undefined
  ) {
    console.error(
      "Provide Post Information Endpoint couldn't be fetched from .env file."
    );
    return false;
  }

  const apiKeyBetweenServices = process.env.API_KEY_BETWEEN_SERVICES;

  if (apiKeyBetweenServices === undefined) {
    console.error(
      "API key between services couldn't be fetched from .env file."
    );
    return false;
  }

  try {
    const response = await fetch(providePostInformationEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: apiKeyBetweenServices,
      },
      body: JSON.stringify({
        postDocPath: postDocPath,
      }),
    });

    if (!response.ok) {
      console.error(
        "Response from 'providePostInformation' API is not okay: \n",
        await response.text()
      );
      return false;
    }

    const result = await response.json();

    const postDocData: PostServerData | false = result.postDocData;

    return {
      postDocPath: postDocPath,
      postDocData: postDocData,
    };
  } catch (error) {
    console.error("Error on fetching to 'providePostInformation': \n", error);
    return false;
  }
}

async function preparePostsForClassifying(posts: Post[]) {
  const getPostInformationPromisesResultArray = await Promise.all(
    posts.map((p) => getPostInformationFromUserSide(p.postDocPath))
  );

  const preparedPostsForClassifying: {
    postDocPath: string;
    postDocData: PostServerData;
  }[] = [];

  for (const result of getPostInformationPromisesResultArray) {
    if (!result) continue;
    if (!result.postDocData) continue;

    preparedPostsForClassifying.push({
      postDocData: result.postDocData,
      postDocPath: result.postDocPath,
    });
  }

  return preparedPostsForClassifying;
}

async function classifyPosts(
  preparedPostsForClassyfing: {
    postDocPath: string;
    postDocData: PostServerData;
  }[],
  modelPathURL: string,
  modelExtension: string,
  img_width: string,
  img_height: string
) {
  const postThemeObjects = await Promise.all(
    preparedPostsForClassyfing.map((p) =>
      createPostThemeObject(
        p,
        modelPathURL,
        modelExtension,
        img_width,
        img_height
      )
    )
  );

  return postThemeObjects;
}

async function createPostThemeObject(
  preparedPost: {
    postDocPath: string;
    postDocData: PostServerData;
  },
  modelPathURL: string,
  modelExtension: string,
  img_width: string,
  img_height: string
) {
  if (preparedPost.postDocData.image.length === 0) {
    const postThemeObject: PostThemeObject = {
      postDocPath: preparedPost.postDocPath,
      themes: ["text"],
      ts: preparedPost.postDocData.creationTime,
    };
    return postThemeObject;
  }

  /**
   * This object will be used when there is an error on classification API.
   */
  const placeHolderPostServerData: PostThemeObject = {
    postDocPath: preparedPost.postDocPath,
    themes: ["no-classification"],
    ts: preparedPost.postDocData.creationTime,
  };

  const apiKey = process.env.PYTHON_API_KEY_V2;
  if (!apiKey) {
    console.error("API key is undefined for uploading model to python api.");
    return placeHolderPostServerData;
  }

  const apiEndpoint = process.env.PYTHON_CLASSIFY_API_ENDPOINT_V2;
  if (!apiEndpoint) {
    console.error(
      "API endpoint is undefined for uploading model to python api."
    );
    return placeHolderPostServerData;
  }

  const formData = new FormData();

  formData.append("image_url", preparedPost.postDocData.image);
  formData.append("model_path_url", modelPathURL);
  formData.append("model_extension", `.${modelExtension}`);
  formData.append("img_width", img_width);
  formData.append("img_height", img_height);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        authorization: apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error(
        "Response from classify image API of provider is not okay:: \n",
        await response.text()
      );
      return placeHolderPostServerData;
    }

    const result = await response.json();
    const predictions = result["predictions"] as PostPredictionObject[];

    const themes: string[] = [];

    predictions.forEach((a) => {
      themes.push(a.class_name);
    });

    const postThemeObject: PostThemeObject = {
      postDocPath: preparedPost.postDocPath,
      themes: themes,
      ts: preparedPost.postDocData.creationTime,
    };

    return postThemeObject;
  } catch (error) {
    console.error("Error on classifiying post: \n", error);
    return placeHolderPostServerData;
  }
}

async function updatePostThemesArray(
  username: string,
  postThemeObjects: PostThemeObject[]
) {
  try {
    await firestore.doc(`/users/${username}/postThemes/postThemes`).set({
      postThemesArray: [...postThemeObjects],
    });
  } catch (error) {
    console.error("Error on updating postThemesArray: \n", error);
    return false;
  }

  return true;
}

async function updateBillDocAtTheEnd(username: string) {
  let activeBillDocCollection;
  try {
    activeBillDocCollection = await firestore
      .collection(`users/${username}/bills`)
      .where("active", "==", true)
      .get();
    if (activeBillDocCollection.empty)
      throw new Error("There is no active bill doc.");
    if (activeBillDocCollection.docs.length !== 1)
      throw new Error("There are more then one active bill doc.");
  } catch (error) {
    console.error("Error on getting active bill doc: \n", error);
    return false;
  }

  const activeBillDoc = activeBillDocCollection.docs[0];
  try {
    await activeBillDoc.ref.update({
      active: false,
    });
  } catch (error) {
    console.error(
      "Error on updatimg 'activeBill' doc while changing 'integrationStarted' field: \n",
      error
    );
    return false;
  }

  return true;
}

async function deleteTempModelSettingsDoc(username: string) {
  try {
    await firestore
      .doc(`/users/${username}/modelSettings/modelSettingsTemp`)
      .delete();
    return true;
  } catch (error) {
    console.error("Error on deleting temp model settings doc.");
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { authorization } = req.headers;

  const operationFromUsername = await handleAuthorization(authorization);
  if (!operationFromUsername) return res.status(401).send("unauthorized");

  const billDocUpdateResultOnStart = await updateBillDocOnIntegrationStart(
    operationFromUsername
  );

  if (!billDocUpdateResultOnStart)
    return res.status(500).send("Internal Server Error");

  const tempModelSettingsData = await getTempModelSettingsData(
    operationFromUsername
  );
  if (!tempModelSettingsData)
    return res.status(500).send("Internal Server Error");

  const modelFileURL = await updateModelFileWithTempOne(
    operationFromUsername,
    tempModelSettingsData.modelExtension
  );

  if (!modelFileURL) return res.status(500).send("Internal Server Error");

  const labelFileURL = await updateLabelFileWithTempOne(operationFromUsername);
  if (!labelFileURL) return res.status(500).send("Internal Server Error");

  const modelPathURL = `/users/${operationFromUsername}/model/model.${tempModelSettingsData.modelExtension}`;

  const uploadModelToPythonAPIResult = await uploadModelToPythonAPIs(
    modelPathURL,
    modelFileURL,
    labelFileURL
  );

  if (!uploadModelToPythonAPIResult)
    return res.status(500).send("Internal Server Error");

  console.log("Model Uploaded.");

  const updateModelSettingsDocResult = await updateModelSettingsDoc(
    operationFromUsername,
    modelFileURL,
    labelFileURL,
    tempModelSettingsData
  );

  if (!updateModelSettingsDocResult)
    return res.status(500).send("Internal Server Error");

  console.log("Model Settings doc updated.");

  const postsArray = await getAllPostsFromServer();
  if (!postsArray) return res.status(500).send("Internal Server Error");

  console.log("Posts Array fethced");

  const preparedPostsForClassifying = await preparePostsForClassifying(
    postsArray
  );

  console.log("Posts Prepared for classifying");

  const imageSize = tempModelSettingsData.inputImageSizes;
  const shape = imageSize.split("x")[0];

  const postThemeObjects = await classifyPosts(
    preparedPostsForClassifying,
    modelPathURL,
    tempModelSettingsData.modelExtension,
    shape,
    shape
  );
  if (!postThemeObjects) return res.status(500).send("Internal Server Error");

  console.log("Post theme objects are created.");

  const postThemesUpdateResult = await updatePostThemesArray(
    operationFromUsername,
    postThemeObjects
  );
  if (!postThemesUpdateResult)
    return res.status(500).send("Internal Server Error");

  console.log("postThemesUpdate successfull.");

  const updateBillDocAtTheEndResult = await updateBillDocAtTheEnd(
    operationFromUsername
  );
  if (!updateBillDocAtTheEndResult)
    return res.status(500).send("Internal Server Error");

  console.log("updateBillDoc successfull.");

  const deleteTempModelSettingsDocResult = await deleteTempModelSettingsDoc(
    operationFromUsername
  );
  if (!deleteTempModelSettingsDocResult)
    return res.status(500).send("Internal Server Error");

  console.log("deleteTempModelSettingsDoc successfull.");

  return res.status(200).send("Suceess.");
}
