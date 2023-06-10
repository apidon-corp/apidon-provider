import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import useSetAlgorithm from "@/hooks/algorithmHooks/useSetAlgorithm";
import { Button, Flex, Text, Textarea } from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function CodeArea() {
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

    //   try {
    //     await JSON.parse(preCandicateAlgorithm);
    //   } catch (error) {
    //     setIsAlgorithmValid(false);
    //   }
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
    <Flex direction="column" bg="black" borderRadius="10px" p="5" width="100%">
      <Flex align="center" gap="2">
        <Text color="gray.700" fontWeight="500" fontSize="15pt">
          Code
        </Text>
        {editingTextArea ? (
          <Flex gap="1">
            <Button
              colorScheme="blue"
              variant="solid"
              onClick={handleSaveButton}
              isLoading={saveButtonLoading}
              isDisabled={isSaveButtonDisabled}
              size="xs"
            >
              Save
            </Button>
            <Button
              onClick={handleCancelButton}
              variant="outline"
              colorScheme="blue"
              isDisabled={saveButtonLoading}
              size="xs"
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
            size="xs"
          >
            Edit
          </Button>
        )}
      </Flex>
      {editingTextArea ? (
        <Textarea
          colorScheme="blue"
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
          color="green.500"
          onChange={handleTextAreaOnChange}
          spellCheck={false}
        />
      ) : (
        <Text color="green.500" fontSize="15pt">
          {currentUserState.algorithm
            ? currentUserState.algorithm
            : "No Code Provided"}
        </Text>
      )}
    </Flex>
  );
}
