import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";

export default function NameArea() {
  const currentUserState = useRecoilValue(currentUserStateAtom);
  return (
    <Flex id="name-area" direction="column">
      <Text color="white" fontWeight="700" fontSize="20pt">
        {currentUserState.name}
      </Text>
    </Flex>
  );
}
