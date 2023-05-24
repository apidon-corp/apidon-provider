import { Flex, Text } from "@chakra-ui/react";
import React from "react";

type Props = {};

export default function ScoreArea({}: Props) {
  return (
    <Flex id="score-area" direction="column">
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Score
      </Text>
      <Text color="yellow.500" fontWeight="700" fontSize="20pt">
        58%
      </Text>
    </Flex>
  );
}
