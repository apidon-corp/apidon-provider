import { Button, Flex, Input } from "@chakra-ui/react";
import ImageArea from "./ImageArea";
import NameArea from "./NameArea";
import { useEffect } from "react";
import { auth } from "@/firebase/clientApp";
import { id } from "ethers";


export default function TopArea() {

  // async function updateAlgorithmSettings(){
  //   try{
  //     const idToken= await auth.currentUser?.getIdToken()

  //     if(!idToken){
  //       return console.error("idToken is undefined")
  //     }
  //     const response = await fetch("/api/user/algorithm/updateAlgorithmSettings", {
  //       method:"POST",
  //       headers:{
  //         authorization: `Bearer ${idToken}`,
  //         "Content-Type": "application/json"
  //       },
  //       body: JSON.stringify({
  //         recencyWeight:53,
  //         relevanceWeight:26
  //       })
  //     })
  //     if(!response.ok){
  //       return console.error("Response is not okay", await response.text())
  //     }
  //     return console.log("api response success: ", await response.text())
  //   }
  //   catch(error){
  //     return console.error("request failed: ", error)
  //   }
  // }

  // useEffect(()=>{
  //   updateAlgorithmSettings();
  // },[])

  return (
    <Flex
      direction="column"
      gap="2"
      justify="center"
      align="center"
      id="top-area"
    >
      <ImageArea />
      <NameArea />
    </Flex>
    
  );
}
