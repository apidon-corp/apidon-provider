//to param =recency and relevance --DONE
//which  one is given if there is a option or request  --DoNE
// update firebase --DONE
//return success --DONE
// it should be in modular format --DONE
// for authantication use prebuild method --DONE
// look the api for providername or username -- satir51

import getDisplayName from "@/apiUtils";
import { firestore } from "@/firebase/adminApp";

import { NextApiRequest, NextApiResponse } from "next";

export const config = {
    runtime: "nodejs",
    maxDuration: 60,
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

// async function setParams(req: NextApiRequest) {
//     const { username, recencyWeight, relavanceWeight } = req.body;

//     const docRef = firestore.doc(`users/${username}/modelSettings/algorithmSettings`);
//     const doc = await docRef.get();

//     if(!doc.exists){
//       console.error("Doc doesn't exist");
//       return false;
//     }

//     const docData= doc.data() as AlgorithmSettingsDocData
//     if(!docData){
//       console.error("docData is empty");
//       return false;
//     }
//     const existingRecencyWeight = docData.recencyWeight
//     const existingRelavanceWeight = docData.relavanceWeight
        
    
    

//     return [recencyWeight, relavanceWeight];
// }


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ){

  const { authorization } = req.headers;
  const { recencyWeight, relevanceWeight } = req.body;

  const username = await handleAuthorization(authorization);
  if (!username) return res.status(401).send("Unauthorized");

  if(!recencyWeight && !relevanceWeight){
    console.error("Both params are missing")
    return res.status(422).send("invalid request")
  }

  let updateObject: {
    recencyWeight?:number,
    relevanceWeight?:number
  } = {}
  
  if(recencyWeight){
    updateObject.recencyWeight = recencyWeight
  }

  if(relevanceWeight){
    updateObject.relevanceWeight = relevanceWeight
  }

  try{
    await firestore
    .doc(`users/${username}/modelSettings/algorithmSettings`)
    .update(updateObject)

    return res.status(200).send("Success");  
  }
  catch{
    return res.status(500).send("Error in Updating Algorithm Settings");
  }

  

}