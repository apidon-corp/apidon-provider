import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";

export default function NameArea() {
  const currentUserState = useRecoilValue(currentUserStateAtom);
  return (
    <Flex id="name-area" direction="column">
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Name
      </Text>
      <Text color="black" fontWeight="700" fontSize="20pt">
        {currentUserState.name}
      </Text>
    </Flex>
  );
}
