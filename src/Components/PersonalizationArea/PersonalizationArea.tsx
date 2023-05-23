import { Flex, Text } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import DescriptionArea from "./DescriptionArea";
import ImageArea from "./ImageArea";

export default function PersonalizationArea() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <>
      <Flex height="40vh" bg="gray.100" width="100%" align="center">
        <Flex id="in-element" height="30vh" width="100%" gap="5" ml="5">
          <Flex
            id="image-area"
            justify="center"
            align="center"
            direction="column"
          >
            <ImageArea />
          </Flex>
          <Flex
            id="other-infos-area"
            height="85%"
            justify="center"
            align="center"
            gap="10"
          >
            <Flex id="name-area" direction="column">
              <Text color="gray.700" fontWeight="500" fontSize="15pt">
                Name
              </Text>
              <Text color="black" fontWeight="700" fontSize="20pt">
                {currentUserState.name}
              </Text>
            </Flex>
            <DescriptionArea />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
