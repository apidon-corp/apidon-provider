import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { ClientCountAreaGraph } from "./ClientCountAreaGraph";
import { ClientAdEntertainmentRateGraph } from "./ClientAdEntertainmentRateGraph";

export default function ClientCountArea() {
  return (
    <Flex height="60vh" bg="gray.200">
      <Flex
        direction="column"
        gap="1"
        align="center"
        width="100%"
        overflowX="auto"
      >
        <Text color="black" fontSize="20pt" fontWeight="700">
          Client Statistics
        </Text>
        <Flex height="50vh" gap="2">
          <ClientCountAreaGraph />
          <ClientAdEntertainmentRateGraph />
        </Flex>
      </Flex>
    </Flex>
  );
}
