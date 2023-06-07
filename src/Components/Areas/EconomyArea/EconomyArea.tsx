import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { IncomeExpenseGraph } from "./IncomeExpenseGraph";

export default function EconomyArea() {
  return (
    <Flex height="60vh" bg="gray.300">
      <Flex direction="column" align="center" width="100%" gap="1">
        <Text color="black" fontWeight="700" fontSize="20pt">
          Economy
        </Text>
        <Flex
          height="50vh"
          gap="2"
          width="100%"
          align="center"
          justify="center"
        >
          <IncomeExpenseGraph />
        </Flex>
        <Flex>
          
        </Flex>
      </Flex>
    </Flex>
  );
}
