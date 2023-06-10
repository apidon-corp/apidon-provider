import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";

export default function ScoreArea() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <Flex
      id="score-area"
      direction="column"
      bg="black"
      borderRadius="10px"
      p="5"
      width="100%"
    >
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Score
      </Text>
      <Text color="yellow.500" fontWeight="700" fontSize="20pt">
        {currentUserState.score ? currentUserState.score : "NaN"}%
      </Text>
    </Flex>
  );
}
