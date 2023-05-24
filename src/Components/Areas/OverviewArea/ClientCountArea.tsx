import { Flex, Text } from "@chakra-ui/react";
import React from "react";

type Props = {};

export default function ClientCountArea({}: Props) {
  return (
    <Flex id="client-count-area" direction="column">
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Client Count
      </Text>
      <Text color="red" fontWeight="700" fontSize="20pt">
        5353
      </Text>
    </Flex>
  );
}
