import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import ClientCountArea from "./ClientCountArea";
import RevenueArea from "./RevenueArea";
import ScoreArea from "./ScoreArea";

export default function StatsArea() {
  return (
    <Flex
      id="stats-area"
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
        Stats
      </Text>
      <RevenueArea />
      <ScoreArea />
      <ClientCountArea />
    </Flex>
  );
}
