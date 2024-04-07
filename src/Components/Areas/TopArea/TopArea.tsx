import { Button, Flex } from "@chakra-ui/react";
import React from "react";
import ImageArea from "./ImageArea";
import NameArea from "./NameArea";

export default function TopArea() {
  return (
    <Flex
      direction="column"
      gap="2"
      justify="center"
      align="center"
      id="top-area"
    >
      <ImageArea />
      <NameArea />
    </Flex>
  );
}
