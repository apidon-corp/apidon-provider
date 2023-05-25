import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import useSetDescription from "@/hooks/personalizationHooks/useSetDescription";
import { Button, Flex, Input, Text, Textarea } from "@chakra-ui/react";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function DescriptionArea() {
  const [currentUserState, setCurrentUserState] =
    useRecoilState(currentUserStateAtom);

  const [isDescriptionEditActive, setIsDescriptionEditActive] = useState(false);
  const [candicateDescription, setCandicateDescription] = useState(
    currentUserState.description
  );

  const [saveButtonLoading, setSaveButtonLoading] = useState(false);

  const [isSaveButtonDisabled, setIsSaveButtonDisabled] = useState(false);

  const { handleUpdateDescription } = useSetDescription();

  const handleTextAreaChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCandicateDescription(event.target.value);
  };

  const handleEditDescriptionButton = () => {
    setIsDescriptionEditActive(true);
  };

  const handleCancelButton = () => {
    setIsDescriptionEditActive(false);
    setCandicateDescription(currentUserState.description);
  };

  const handleSaveButton = async () => {
    setSaveButtonLoading(true);

    const operationResult = await handleUpdateDescription(candicateDescription);

    if (operationResult) {
      setCurrentUserState((prev) => ({
        ...prev,
        description: candicateDescription,
      }));
      setIsDescriptionEditActive(false);
    }

    setSaveButtonLoading(false);
  };

  useEffect(() => {
    const tempIsSaveButtonDisabled =
      currentUserState.description === candicateDescription;
    setIsSaveButtonDisabled(tempIsSaveButtonDisabled);
  }, [currentUserState.description, candicateDescription]);

  return (
    <Flex direction="column" maxWidth="500px">
      <Flex align="center" gap="2">
        <Text color="gray.700" fontWeight="500" fontSize="15pt">
          Description
        </Text>
        {isDescriptionEditActive ? (
          <Flex gap="1">
            <Button
              variant="solid"
              colorScheme="blue"
              size="xs"
              onClick={handleSaveButton}
              isLoading={saveButtonLoading}
              isDisabled={isSaveButtonDisabled}
            >
              Save
            </Button>
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={handleCancelButton}
              size="xs"
              isDisabled={saveButtonLoading}
            >
              Cancel
            </Button>
          </Flex>
        ) : (
          <Button
            variant={currentUserState.description ? "outline" : "solid"}
            colorScheme="blue"
            size="xs"
            onClick={handleEditDescriptionButton}
          >
            Edit
          </Button>
        )}
      </Flex>

      {isDescriptionEditActive ? (
        <Input
          value={candicateDescription}
          onChange={handleTextAreaChange}
          color="black"
          fontWeight="700"
          fontSize="20pt"
          isDisabled={saveButtonLoading}
          variant="flushed"
        />
      ) : (
        <Text color="black" fontWeight="700" fontSize="20pt">
          {currentUserState.description
            ? currentUserState.description
            : "No description provided yet."}
        </Text>
      )}
    </Flex>
  );
}
