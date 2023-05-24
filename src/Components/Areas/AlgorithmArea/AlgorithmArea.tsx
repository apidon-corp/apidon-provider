import { Flex, Text } from "@chakra-ui/react";

type Props = {};

export default function AlgorithmArea({}: Props) {
  return (
    <Flex height="60vh" bg="gray.400">
      <Flex direction="column" align="center" width="100%" gap="1">
        <Text color="black" fontWeight="700" fontSize="20pt">
          Algorithm
        </Text>
      </Flex>
    </Flex>
  );
}
