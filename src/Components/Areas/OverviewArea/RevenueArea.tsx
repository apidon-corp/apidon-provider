import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import { useRecoilValue } from "recoil";

export default function RevenueArea() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <Flex id="revenue-area" direction="column">
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Revenue
      </Text>
      <Text color="green" fontWeight="700" fontSize="20pt">
        {currentUserState.revenue ? currentUserState.revenue : "NaN"}
      </Text>
    </Flex>
  );
}
