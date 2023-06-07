import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import useSetOffer from "@/hooks/economyHooks/useSetOffer";
import { Button, Flex, Input, Text, useEditable } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";

export default function OfferArea() {
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
    const tempSaveButtonDisabled = currentUserState.offer === candicateOffer;
    setSaveButtonDisabledStatus(tempSaveButtonDisabled);
  }, [candicateOffer]);

  const handleOfferInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const susCandicateOffer = event.target.value;

    if (
      susCandicateOffer[susCandicateOffer.length - 1] === "." &&
      !(susCandicateOffer.split(".").length > 2)
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
    <Flex id="offer-area" direction="column">
      <Flex align="center" gap="2">
        <Text color="gray.700" fontWeight="500" fontSize="15pt">
          Offer
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
      {isOfferEditActive ? (
        <Input
          value={candicateOfferInput}
          fontWeight="700"
          fontSize="20pt"
          variant="flushed"
          onChange={handleOfferInputChange}
          disabled={saveButtonLoading}
        />
      ) : (
        <Text color="black" fontWeight="700" fontSize="20pt">
          {currentUserState.offer}
        </Text>
      )}
    </Flex>
  );
}
