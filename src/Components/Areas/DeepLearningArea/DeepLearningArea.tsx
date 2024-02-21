import { auth } from "@/Firebase/clientApp";
import {
  AspectRatio,
  Button,
  Flex,
  Icon,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import React, { useRef, useState } from "react";

import { AiOutlineCloudUpload } from "react-icons/ai";

export default function DeepLearningArea() {
  const [image, setImage] = useState("");

  const [opStarted, setOpStarted] = useState(false);
  const [result, setResult] = useState("");

  const ref = useRef<HTMLInputElement>(null);

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return console.error("No Files provided.");
    }

    if (event.target.files.length === 0) {
      return console.error("No Files provided.");
    }

    const file = event.target.files[0];

    if (!file.type.startsWith("image/")) {
      return console.log("Only Images");
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (readerEvent) => {
      setImage(readerEvent.target?.result as string);
    };
  };

  const handleProcessButton = async () => {
    if (result.length > 0) {
      setImage("");
      setResult("");
      if (ref.current) ref.current.value = "";
      return;
    }

    setOpStarted(true);

    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error while setting algorithm. Couln't be got idToken",
        error
      );
      return false;
    }

    let response: Response;
    try {
      response = await fetch("/api/user/imageClassify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          image: image,
        }),
      });
    } catch (error) {
      setOpStarted(false);
      return console.error("Error while fetching to API...", error);
    }

    if (!response.ok) {
      setOpStarted(false);
      return console.log(
        "There is an error in API side.",
        await response.text()
      );
    }

    console.info("API operations are succesfull...");

    let responseResult;
    try {
      responseResult = await response.json();
    } catch (error) {
      return console.error("Error while getting response...", error);
    }

    const predictions = responseResult.predictions;
    console.info(Object.keys(predictions));

    const predictionKeys = Object.keys(predictions);
    const topResult = predictionKeys[0];

    const labelTopResult = topResult.replace("_", " ").toUpperCase();

    setResult(labelTopResult);
    setOpStarted(false);
  };

  return (
    <Flex
      id="algorithm-area"
      direction="column"
      gap="2"
      borderRadius="10px"
      p="2"
      bg="gray.900"
      width="100%"
      align="center"
      justify="center"
    >
      <Text color="gray.500" fontWeight="700" fontSize="14pt">
        Deep Learning
      </Text>
      <Flex
        id="curreny-area"
        direction="column"
        bg="black"
        borderRadius="10px"
        p="5"
        width="100%"
      >
        <Text color="gray.700" fontWeight="500" fontSize="15pt">
          Learning Model
        </Text>
        <Text color="red.500" fontWeight="700" fontSize="20pt">
          TensorFlow - Keras
        </Text>
      </Flex>
      <Flex
        id="rendered image"
        width="100%"
        hidden={image.length === 0}
        position="relative"
      >
        <Flex
          width="100%"
          height="100%"
          position="absolute"
          zIndex="1"
          justify="center"
          align="center"
          bg={opStarted || result.length > 0 ? "rgba(0,0,0,0.85)" : ""}
        >
          {opStarted && (
            <Spinner
              width="10rem"
              height="10rem"
              thickness="12px"
              color="blue.500"
            />
          )}

          <Text
            color="white"
            fontWeight="700"
            fontSize="5xl"
            width="100%"
            textAlign="center"
            hidden={result.length === 0}
          >
            {result}
          </Text>
        </Flex>

        <AspectRatio ratio={1} width="100%">
          <img
            style={{
              borderRadius: "10px",
              objectFit: "cover",
            }}
            alt=""
            src={image}
          />
        </AspectRatio>
      </Flex>
      <Flex
        id="image-drop-area"
        width="100%"
        hidden={image.length !== 0}
        bg="black"
        borderRadius="xl"
      >
        <AspectRatio ratio={1} width="100%">
          <Flex justify="center" align="center">
            <Icon
              as={AiOutlineCloudUpload}
              fontSize="5rem"
              color="white"
              onClick={() => {
                ref.current?.click();
              }}
            />
            <Input
              ref={ref}
              type="file"
              accept="image/*"
              onChange={onImageChange}
              hidden
            />
          </Flex>
        </AspectRatio>
      </Flex>
      <Flex width="100%">
        <Button
          variant="outline"
          colorScheme="blue"
          width="100%"
          borderRadius="xl"
          isDisabled={image.length === 0}
          onClick={handleProcessButton}
          isLoading={opStarted}
        >
          {result.length > 0
            ? "Try Again"
            : image.length > 0
            ? "Start Processing"
            : "Upload Image First"}
        </Button>
      </Flex>
    </Flex>
  );
}
