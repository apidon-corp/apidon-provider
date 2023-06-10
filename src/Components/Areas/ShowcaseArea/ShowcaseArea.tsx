import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import DescriptionArea from "./DescriptionArea";

export default function ShowcaseArea() {
  return (
    <Flex
      id="showcase-area"
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
        Showcase
      </Text>
      <DescriptionArea />
    </Flex>
  );
}
