import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import useSetAlgorithm from "@/hooks/algorithmHooks/useSetAlgorithm";
import { Button, Flex, Text, Textarea } from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function AlgorithmArea() {
  const [editingTextArea, setEditingTextArea] = useState(false);

  const [currentUserState, setCurrentUserState] =
    useRecoilState(currentUserStateAtom);

  const [candicateAlgorithm, setCandicateAlgorithm] = useState(
    currentUserState.algorithm
  );

  const [saveButtonLoading, setSaveButtonLoading] = useState(false);

  const { setAlgorithm } = useSetAlgorithm();

  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(false);

  const [isTextAreaDisabled, setIsTextAreaDisabled] = useState(false);

  const [isAlgorithmValid, setIsAlgorithmValid] = useState(true);

  useEffect(() => {
    const tempIsSaveButtonDisabled =
      currentUserState.algorithm === candicateAlgorithm || !isAlgorithmValid;

    setIsSaveButtonDisabled(tempIsSaveButtonDisabled);
  }, [currentUserState.algorithm, candicateAlgorithm, isAlgorithmValid]);

  useEffect(() => {
    const tempIsTextAreaDisabled = !editingTextArea || saveButtonLoading;
    setIsTextAreaDisabled(tempIsTextAreaDisabled);
  }, [editingTextArea, saveButtonLoading]);

  const handleEditButton = () => {
    setEditingTextArea(true);
  };

  const handleCancelButton = () => {
    setEditingTextArea(false);
    setCandicateAlgorithm(
      currentUserState.algorithm ? currentUserState.algorithm : ""
    );
  };

  const handleTextAreaOnChange = async (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const preCandicateAlgorithm = event.target.value;

    setIsAlgorithmValid(true);

    setCandicateAlgorithm(preCandicateAlgorithm);

    try {
      await JSON.parse(preCandicateAlgorithm);
    } catch (error) {
      setIsAlgorithmValid(false);
    }
  };

  const handleSaveButton = async () => {
    setSaveButtonLoading(true);

    const operationResult = await setAlgorithm(candicateAlgorithm);

    if (operationResult) {
      setCurrentUserState((prev) => ({
        ...prev,
        algorithm: candicateAlgorithm,
      }));

      setEditingTextArea(false);
    }

    setSaveButtonLoading(false);
  };

  return (
    <Flex height="60vh" bg="gray.400" direction="column" gap="2" align="center">
      <Text color="black" fontWeight="700" fontSize="20pt">
        Algorithm
      </Text>

      <Textarea
        colorScheme="blue"
        maxWidth="80%"
        isDisabled={isTextAreaDisabled}
        border={isAlgorithmValid ? "1px solid black" : "1px solid red"}
        fontSize="15pt"
        _hover={{
          border: isAlgorithmValid ? "1px solid black" : "1px solid red",
        }}
        _focus={{
          border: isAlgorithmValid ? "1px solid blue" : "1px solid red",
        }}
        value={candicateAlgorithm}
        onChange={handleTextAreaOnChange}
      />

      {editingTextArea ? (
        <Flex gap="1">
          <Button
            colorScheme="blue"
            variant="solid"
            onClick={handleSaveButton}
            isLoading={saveButtonLoading}
            isDisabled={isSaveButtonDisabled}
          >
            Save
          </Button>
          <Button
            onClick={handleCancelButton}
            variant="outline"
            colorScheme="blue"
            isDisabled={saveButtonLoading}
          >
            Cancel
          </Button>
        </Flex>
      ) : (
        <Button
          variant="outline"
          colorScheme="blue"
          onClick={handleEditButton}
          maxWidth="200px"
        >
          Edit
        </Button>
      )}
    </Flex>
  );
}
