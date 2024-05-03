import { billingModalStatusAtom } from "@/atoms/billingModalStatusAtom";
import { auth, firestore } from "@/firebase/clientApp";
import useUploadModel from "@/hooks/modelHooks/useUploadModel";
import { ModelSettings } from "@/types/Model";
import { Button, Flex, Input, Select, Text } from "@chakra-ui/react";
import { doc, getDoc } from "firebase/firestore";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useSetRecoilState } from "recoil";
import BillingModal from "./BillingModal";

export default function AlgorithmArea() {
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [modelSettingsState, setModelSettingsState] = useState<ModelSettings>({
    inputImageSizes: "120x120",
    modelEnvironment: "keras",
    modelExtension: "h5",
    modelPath: "https://google.com",
  });
  const [initialModelSettingState, setInitialModelSettingState] =
    useState<ModelSettings>({
      inputImageSizes: "120x120",
      modelEnvironment: "keras",
      modelExtension: "h5",
      modelPath: "https://google.com",
    });

  const [loading, setLoading] = useState(false);
  const [modelFileChoosen, setModelFileChoosen] = useState<File | null>(null);

  const [differenceMade, setDifferenceMade] = useState(false);

  const { uploadModel } = useUploadModel();

  const setBillingModalState = useSetRecoilState(billingModalStatusAtom);

  // Initially fetch data...
  useEffect(() => {
    handleGetInitialDataFromServer();
  }, []);

  // Set buttons status...
  useEffect(() => {
    setDifferenceMade(modelFileChoosen !== null);
  }, [modelFileChoosen]);

  const handleSelection = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (event.target.id === "modelEnvironment") {
      // We need to set default extension if "modelEnvironment" changed.
      let defaultExtension: "h5" | "pt" = "h5";
      if (event.target.value === "tensorflow") {
        defaultExtension = "h5";
      } else if (event.target.value === "pytorch") {
        defaultExtension = "pt";
      } else if (event.target.value === "keras") {
        defaultExtension = "h5";
      }

      setModelSettingsState((prev) => ({
        ...prev,
        [event.target.id]: event.target.value,
        modelExtension: defaultExtension,
      }));
    } else {
      setModelSettingsState((prev) => ({
        ...prev,
        [event.target.id]: event.target.value,
      }));
    }
  };

  const handleContinueBillingButton = async () => {
    setBillingModalState({ isOpen: true });
  };

  const handleIntegrateModel = async () => {
    setLoading(true);

    if (!modelFileChoosen) {
      console.error("There is no file choosen.");
      return setLoading(false);
    }

    const modelPathURL = await uploadModel(
      modelFileChoosen,
      modelSettingsState.modelExtension
    );

    if (!modelPathURL) {
      console.error("Model upload operation is failed.");
      return setLoading(false);
    }

    const authObject = auth.currentUser;

    if (authObject === null) {
      console.error("There is no user for operation.");
      return setLoading(false);
    }

    const idToken = await authObject.getIdToken();
    if (idToken === undefined) {
      console.error("IdToken is undefined.");
      return setLoading(false);
    }

    try {
      // Prepearing body.
      const body: ModelSettings = {
        inputImageSizes: modelSettingsState.inputImageSizes,
        modelEnvironment: modelSettingsState.modelEnvironment,
        modelExtension: modelSettingsState.modelExtension,
        modelPath: modelPathURL,
      };

      const response = await fetch("api/user/model/integrateModel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },

        body: JSON.stringify({ ...body }),
      });

      if (!response.ok) {
        console.error(
          "Response from 'integrateModel' is not okay: \n",
          await response.text()
        );
        return setLoading(false);
      }

      // Everthing is alright...
      setModelSettingsState((prev) => ({ ...prev, modelPath: modelPathURL }));
      setInitialModelSettingState((prev) => ({
        ...prev,
        modelPath: modelPathURL,
      }));
      clearModelInput();
      return setLoading(false);
    } catch (error) {
      console.error("Error on fetching integrateModelAPI: \n", error);
      return setLoading(false);
    }
  };

  const handleDiscardChangesButton = async () => {
    setModelSettingsState(initialModelSettingState);

    clearModelInput();
  };

  const clearModelInput = () => {
    setModelFileChoosen(null);
    if (modelInputRef.current) modelInputRef.current.value = "";
  };

  const handleGetInitialDataFromServer = async () => {
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
      return setModelSettingsState({
        inputImageSizes: "120x120",
        modelEnvironment: "keras",
        modelExtension: "h5",
        modelPath: "NOT FOUND",
      });
    }

    const modelSettingsDataInServer: ModelSettings =
      modelSettingsDocFromServer.data() as ModelSettings;

    setInitialModelSettingState(modelSettingsDataInServer);
    setModelSettingsState(modelSettingsDataInServer);
  };

  const handleModelFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const modelFileFromInput = event.target.files[0];

    setModelFileChoosen(modelFileFromInput);
  };

  return (
    <>
      <BillingModal handleIntegrateModel={handleIntegrateModel} />
      <Flex
        id="algorithm-area"
        direction="column"
        gap="2"
        borderRadius="10px"
        p="2"
        bg="gray.900"
        width="100%"
        justify="center"
        align="center"
      >
        <Text color="gray.500" fontWeight="700" fontSize="14pt">
          Classification Model
        </Text>
        <Flex id="Model-Settings" direction="column" gap="5px" width="100%">
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
            <Select
              id="modelEnvironment"
              onChange={handleSelection}
              value={modelSettingsState.modelEnvironment}
              iconColor="white"
              sx={{
                backgroundColor: "black",
                textColor: "#D69E2E",
                fontWeight: "700",
                fontSize: "20pt",
                borderWidth: "0px",
                paddingLeft: 0,
              }}
              isDisabled={loading}
            >
              <option value="tensorflow">TensorFlow</option>
              <option value="pytorch">PyTorch</option>
              <option value="keras">Keras</option>
            </Select>
          </Flex>
          <Flex
            id="input-imagesize"
            direction="column"
            bg="black"
            borderRadius="10px"
            p="5"
            width="100%"
          >
            <Text color="gray.700" fontWeight="500" fontSize="15pt">
              Input Image Sizes
            </Text>
            <Select
              id="inputImageSizes"
              onChange={handleSelection}
              value={modelSettingsState.inputImageSizes}
              iconColor="white"
              sx={{
                backgroundColor: "black",
                textColor: "#00B5D8",
                fontWeight: "700",
                fontSize: "20pt",
                borderWidth: "0px",
                paddingLeft: 0,
              }}
              isDisabled={loading}
            >
              <option value="64x64">64 x 64</option>
              <option value="120x120">120 x 120</option>
              <option value="224x224">224 x 224</option>
              <option value="299x299">299 x 299</option>
              <option value="331x331">331 x 331</option>
              <option value="512x512">512 x 512</option>
            </Select>
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
            <Select
              id="modelExtension"
              onChange={handleSelection}
              value={modelSettingsState.modelExtension}
              iconColor="white"
              sx={{
                backgroundColor: "black",
                textColor: "#805AD5",
                fontWeight: "700",
                fontSize: "20pt",
                borderWidth: "0px",
                paddingLeft: 0,
              }}
              isDisabled={loading}
            >
              {modelSettingsState.modelEnvironment === "tensorflow" && (
                <>
                  <option value="h5">.h5</option>
                  <option value="tflite">.tflite</option>
                </>
              )}
              {modelSettingsState.modelEnvironment === "keras" && (
                <option value="h5">.h5</option>
              )}
              {modelSettingsState.modelEnvironment === "pytorch" && (
                <>
                  <option value="pt">.pt</option>
                  <option value="pth">.pth</option>
                </>
              )}
            </Select>
          </Flex>
          <Flex
            id="model-environemt"
            direction="column"
            bg="black"
            borderRadius="10px"
            p="5"
            width="100%"
          >
            <Flex align="center" gap="2">
              <Text color="gray.700" fontWeight="500" fontSize="15pt">
                Model File
              </Text>
              <Button
                variant="outline"
                colorScheme="blue"
                size="xs"
                onClick={() => {
                  if (modelInputRef.current) modelInputRef.current.click();
                }}
                isDisabled={loading}
              >
                Choose New Model
              </Button>
            </Flex>

            <Text
              color="pink.500"
              fontWeight="700"
              fontSize="20pt"
              maxWidth="15em"
              isTruncated
            >
              <a
                href={
                  modelSettingsState.modelPath
                    ? modelSettingsState.modelPath
                    : "https://apidon.com"
                }
              >
                {modelFileChoosen
                  ? modelFileChoosen.name
                  : modelSettingsState.modelPath}
              </a>
            </Text>

            <Input
              ref={modelInputRef}
              onChange={handleModelFileChange}
              type="file"
              accept={`.${modelSettingsState.modelExtension}`}
              hidden
            />
          </Flex>
        </Flex>
        <Flex justify="center" align="center" gap="2">
          <Button
            variant="solid"
            colorScheme="blue"
            size="sm"
            onClick={() => {
              handleContinueBillingButton();
            }}
            isLoading={loading}
            isDisabled={!differenceMade}
          >
            Continue to Billing
          </Button>
          <Button
            variant="outline"
            colorScheme="blue"
            size="sm"
            onClick={() => {
              handleDiscardChangesButton();
            }}
            isDisabled={loading || !differenceMade}
          >
            Discard Changes
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
