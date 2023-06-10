import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import CurrencyArea from "./CurrencyArea";
import AmountArea from "./AmountArea";

export default function OfferArea() {
  return (
    <Flex
      id="offer-area"
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
        Offer
      </Text>
      <CurrencyArea />
      <AmountArea />
    </Flex>
  );
}
