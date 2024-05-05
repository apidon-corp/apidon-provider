import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import useSetOffer from "@/hooks/economyHooks/useSetOffer";
import { Button, Flex, Input, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function AmountArea() {
  const [currentUserState, setCurrentUserState] =
    useRecoilState(currentUserStateAtom);

  const [isOfferEditActive, setIsOfferEditActive] = useState(false);

  const [candicateOffer, setCandicateOffer] = useState(currentUserState.offer);
  const [candicateOfferInput, setCandicateOfferInput] = useState(
    currentUserState.offer.toString()
  );

  const [saveButtonLoading, setSaveButtonLoading] = useState(false);
  const [saveButtonDisabledStatus, setSaveButtonDisabledStatus] =
    useState(false);

  const { setOffer } = useSetOffer();

  useEffect(() => {
    const tempSaveButtonDisabled =
      currentUserState.offer === candicateOffer || !candicateOfferInput;
    setSaveButtonDisabledStatus(tempSaveButtonDisabled);
  }, [candicateOffer, candicateOfferInput]);

  const handleOfferInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const susCandicateOffer = event.target.value;

    if (!susCandicateOffer) return setCandicateOfferInput(susCandicateOffer);

    if (
      susCandicateOffer[susCandicateOffer.length - 1] === "." &&
      susCandicateOffer.split(".").length <= 2
    ) {
      return setCandicateOfferInput(susCandicateOffer);
    }

    const numberSusCandicateOffer = Number(susCandicateOffer);
    if (isNaN(numberSusCandicateOffer)) return;

    setCandicateOffer(numberSusCandicateOffer);
    setCandicateOfferInput(numberSusCandicateOffer.toString());
  };

  const handleEditButton = () => {
    setIsOfferEditActive(true);
  };

  const handleSaveButton = async () => {
    setSaveButtonLoading(true);

    const operationResult = await setOffer(candicateOffer);

    if (operationResult) {
      setCurrentUserState((prev) => ({ ...prev, offer: candicateOffer }));
      setIsOfferEditActive(false);
    }

    setSaveButtonLoading(false);
  };

  const handleCancelButton = () => {
    setIsOfferEditActive(false);

    setCandicateOfferInput(currentUserState.offer.toString());
    setCandicateOffer(currentUserState.offer);
  };

  return (
    <Flex borderRadius="10px" p="5" width="100%" bg="black" direction="column">
      <Flex align="center" gap="2">
        <Text color="gray.700" fontWeight="500" fontSize="15pt">
          Amount
        </Text>
        {isOfferEditActive ? (
          <Flex gap="1">
            <Button
              colorScheme="blue"
              size="xs"
              variant="solid"
              isLoading={saveButtonLoading}
              isDisabled={saveButtonDisabledStatus}
              onClick={handleSaveButton}
            >
              Save
            </Button>
            <Button
              colorScheme="blue"
              size="xs"
              variant="outline"
              onClick={handleCancelButton}
              isDisabled={saveButtonLoading}
            >
              Cancel
            </Button>
          </Flex>
        ) : (
          <Button
            variant={currentUserState.offer ? "outline" : "solid"}
            colorScheme="blue"
            size="xs"
            onClick={handleEditButton}
          >
            Edit
          </Button>
        )}
      </Flex>

      <Flex align="center">
        {isOfferEditActive ? (
          <Input
            value={candicateOfferInput}
            fontWeight="700"
            fontSize="20pt"
            variant="flushed"
            color="blue.500"
            onChange={handleOfferInputChange}
            disabled={saveButtonLoading}
          />
        ) : (
          <Text color="blue.500" fontWeight="700" fontSize="20pt">
            {currentUserState.offer}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
