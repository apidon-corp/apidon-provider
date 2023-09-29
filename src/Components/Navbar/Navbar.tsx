import { Flex, Text } from "@chakra-ui/react";
import React from "react";
import AuthButtons from "./AuthButtons";

export default function Navbar() {
  return (
    <>
      <Flex
        id="small-screen-navbar"
        position="sticky"
        top="0"
        width="100%"
        height="50px"
        backdropFilter="auto"
        backdropBlur="10px"
        zIndex="banner"
        display={{
          base: "flex",
          sm: "flex",
          md: "none",
          lg: "none",
        }}
        align="center"
        justify="space-between"
      >
        <Text
          color="white"
          fontSize="20pt"
          fontWeight={700}
          cursor="pointer"
          ml="3"
        >
          apidon-Pro
        </Text>
        <Flex mr="2">
          <AuthButtons />
        </Flex>
      </Flex>
      <Flex
        id="large-screen-navbar"
        position="sticky"
        top="0"
        width="100%"
        backdropFilter="auto"
        backdropBlur="10px"
        zIndex="banner"
        display={{
          base: "none",
          sm: "none",
          md: "flex",
          lg: "flex",
        }}
        bg="rgba(0, 0, 0, 1)"
        height="55px"
        align="center"
      >
        <Flex ml="5">
          <Text color="white" fontSize="20pt" fontWeight={700} cursor="pointer">
            apdion-Pro
          </Text>
        </Flex>
        <Flex position="absolute" right="5">
          <AuthButtons />
        </Flex>
      </Flex>
    </>
  );
}
