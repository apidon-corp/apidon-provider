import { auth, firestore } from "@/Firebase/clientApp";
import useUpdateModelSettings from "@/hooks/modelHooks/useUpdateModelSettings";
import { ModelSettings } from "@/types/Model";
import { Button, Flex, Input, Select, Text } from "@chakra-ui/react";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

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

  const handleSelection = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setModelSettingsState((prev) => ({
      ...prev,
      [event.target.id]: event.target.value,
    }));
  };

  const { updateModelSettings } = useUpdateModelSettings();

  const handleSaveChangesButton = async () => {
    setLoading(true);
    const operationResult = await updateModelSettings(modelSettingsState);

    if (operationResult) {
      setInitialModelSettingState(modelSettingsState);
    } else {
      // Giving Error...
    }

    setLoading(false);
  };

  const handleDiscardChangesButton = async () => {
    setModelSettingsState(initialModelSettingState);
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

  useEffect(() => {
    handleGetInitialDataFromServer();
  }, []);

  return (
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
          >
            <option value="h5">.h5 (Keras/TensorFlow)</option>
            <option value="tflite">.tflite (TensorFlow Lite)</option>
            <option value="pb">.pb (TensorFlow Protobuf)</option>
            <option value="pt">.pt (PyTorch)</option>
            <option value="pth">.pth (PyTorch)</option>
            <option value="onnx">.onnx (ONNX)</option>
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
            >
              Upload New Model
            </Button>
          </Flex>

          <Text color="pink.500" fontWeight="700" fontSize="20pt">
            <a href=" https://google.com">{modelSettingsState.modelPath}</a>
          </Text>

          <Input
            ref={modelInputRef}
            type="file"
            accept={`.${modelSettingsState.modelExtension}`}
            hidden
          />
        </Flex>
      </Flex>
      <Flex justify="center" align="center" gap="2">
        <Button
          variant="outline"
          colorScheme="red"
          size="md"
          onClick={() => {
            handleSaveChangesButton();
          }}
          isLoading={loading}
        >
          Save Model Changes
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          size="md"
          onClick={() => {
            handleDiscardChangesButton();
          }}
          isDisabled={loading}
        >
          Discard Changes
        </Button>
      </Flex>
    </Flex>
  );
}
