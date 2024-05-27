import { billingModalStatusAtom } from "@/atoms/billingModalStatusAtom";
import { auth, firestore } from "@/firebase/clientApp";

import { ModelSettings } from "@/types/Model";
import { Button, Flex, Spinner, Text } from "@chakra-ui/react";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import BillingModal from "./BillingModal";

export default function AlgorithmArea() {
  const [modelSettingsState, setModelSettingsState] = useState<ModelSettings>({
    inputImageSizes: "120x120",
    modelEnvironment: "keras",
    modelExtension: "h5",
    modelPath: "NOT-FOUND",
    labelPath: "NOT-FOUND",
  });

  const [billingModelState, setBillingModalState] = useRecoilState(
    billingModalStatusAtom
  );

  const [loading, setLoading] = useState(true);

  // Initially fetch data...
  useEffect(() => {
    if (!billingModelState.isOpen) handleGetInitialDataFromServer();
  }, [billingModelState.isOpen]);

  const handleGetInitialDataFromServer = async () => {
    setLoading(true);
    const modelSettingsDocFromServer = await getDoc(
      doc(
        firestore,
        `users/${auth.currentUser?.displayName}/modelSettings/modelSettings`
      )
    );

    if (
      !modelSettingsDocFromServer.exists() ||
      !modelSettingsDocFromServer.data()
    ) {
      setLoading(false);
      return setModelSettingsState({
        inputImageSizes: "120x120",
        modelEnvironment: "keras",
        modelExtension: "h5",
        modelPath: "NOT FOUND",
        labelPath: "NOT FOUND",
      });
    }

    const modelSettingsDataInServer: ModelSettings =
      modelSettingsDocFromServer.data() as ModelSettings;

    setModelSettingsState(modelSettingsDataInServer);

    setLoading(false);
  };

  const handleUpdateAlgorithmButton = () => {
    setBillingModalState({ isOpen: true });
  };

  return (
    <>
      <Flex
        id="algorithm-area"
        direction="column"
        gap="5"
        borderRadius="10px"
        p="2"
        bg="gray.900"
        width="100%"
        justify="center"
        align="center"
      >
        <Text color="gray.500" fontWeight="700" fontSize="14pt" bg="gray.900">
          Algorithm
        </Text>

        {loading ? (
          <Flex width="100%" align="center" justify="center" p="5">
            <Spinner width="5em" height="5em" color="yellow.500" />
          </Flex>
        ) : (
          <>
            <Flex
              id="current-model-technical-information"
              align="center"
              width="100%"
              justify="space-between"
              gap="5px"
            >
              <Flex
                id="model-environemt"
                direction="column"
                bg="black"
                borderRadius="10px"
                p="5"
                width="100%"
              >
                <Text color="gray.700" fontWeight="500" fontSize="15pt">
                  Model Environment
                </Text>
                <Text fontSize="20pt" fontWeight="700" color="#D69E2E">
                  {modelSettingsState.modelEnvironment}
                </Text>
              </Flex>
              <Flex
                id="model-input-size"
                direction="column"
                bg="black"
                borderRadius="10px"
                p="5"
                width="100%"
              >
                <Text color="gray.700" fontWeight="500" fontSize="15pt">
                  Model Input Sizes
                </Text>
                <Text fontSize="20pt" fontWeight="700" color="#D69E2E">
                  {modelSettingsState.inputImageSizes}
                </Text>
              </Flex>
              <Flex
                id="model-extension"
                direction="column"
                bg="black"
                borderRadius="10px"
                p="5"
                width="100%"
              >
                <Text color="gray.700" fontWeight="500" fontSize="15pt">
                  Model Extension
                </Text>
                <Text fontSize="20pt" fontWeight="700" color="#D69E2E">
                  {modelSettingsState.modelExtension}
                </Text>
              </Flex>
              <Flex
                id="model-file-url"
                direction="column"
                bg="black"
                borderRadius="10px"
                p="5"
                width="100%"
              >
                <Text color="gray.700" fontWeight="500" fontSize="15pt">
                  Model File
                </Text>
                <Text fontSize="20pt" fontWeight="700" color="#D69E2E">
                  {modelSettingsState.modelPath.slice(0, 10)}...
                </Text>
              </Flex>
            </Flex>
            <Flex
              id="change-algorithm"
              width="100%"
              align="center"
              justify="center"
              mb="5"
            >
              <Button
                variant="outline"
                colorScheme="teal"
                size="md"
                onClick={handleUpdateAlgorithmButton}
              >
                Update Algorithm
              </Button>
            </Flex>
          </>
        )}
      </Flex>

      <BillingModal />
    </>
  );
}
