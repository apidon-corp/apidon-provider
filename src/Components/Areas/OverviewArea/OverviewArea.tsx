import { Flex } from "@chakra-ui/react";

import ClientCountArea from "./ClientCountArea";
import DescriptionArea from "./DescriptionArea";
import ImageArea from "./ImageArea";
import NameArea from "./NameArea";
import RevenueArea from "./RevenueArea";
import ScoreArea from "./ScoreArea";

export default function OverviewArea() {
  return (
    <>
      <Flex height="40vh" bg="gray.100" width="100%" align="center">
        <Flex
          id="in-element"
          height="30vh"
          width="100%"
          ml="5"
          align="center"
          justify="center"
          direction="column"
          gap="10"
        >
          <ImageArea />
          <Flex gap="10">
            <NameArea />
            <DescriptionArea />
            <RevenueArea />
            <ScoreArea />
            <ClientCountArea />
          </Flex>
        </Flex>
      </Flex>
    </>
  );
}
