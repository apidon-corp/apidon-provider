import { Flex, Text } from "@chakra-ui/react";
import React from "react";

type Props = {};

export default function RevenueArea({}: Props) {
  return (
    <Flex id="revenue-area" direction="column">
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Revenue
      </Text>
      <Text color="green" fontWeight="700" fontSize="20pt">
        $5334
      </Text>
    </Flex>
  );
}
