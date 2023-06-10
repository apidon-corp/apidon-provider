import { Flex, Text } from "@chakra-ui/react";

export default function ProgrammingLanguageArea() {
  return (
    <Flex
      id="curreny-area"
      direction="column"
      bg="black"
      borderRadius="10px"
      p="5"
      width="100%"
    >
      <Text color="gray.700" fontWeight="500" fontSize="15pt">
        Language
      </Text>
      <Text color="yellow.500" fontWeight="700" fontSize="20pt">
        Python
      </Text>
    </Flex>
  );
}
