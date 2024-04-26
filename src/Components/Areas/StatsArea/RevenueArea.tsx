import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";

export default function RevenueArea() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <Flex
      id="revenue-area"
      direction="column"
      bg="black"
      borderRadius="10px"
      p="5"
      width="100%"
    >
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Revenue (MATIC)
      </Text>
      <Text color="green" fontWeight="700" fontSize="20pt">
        {currentUserState.revenue
          ? currentUserState.revenue.toString().slice(0, 4)
          : "0"}
      </Text>
    </Flex>
  );
}
