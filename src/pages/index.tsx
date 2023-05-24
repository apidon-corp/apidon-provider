import AlgorithmArea from "@/Components/Areas/AlgorithmArea/AlgorithmArea";
import ClientCountArea from "@/Components/Areas/ClientStatisticsArea/ClientStatisticsArea";
import EconomyArea from "@/Components/Areas/EconomyArea/EconomyArea";

import PersonalizationArea from "@/Components/Areas/PersonalizationArea/PersonalizationArea";
import { Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex direction="column" width="100%">
      <PersonalizationArea />
      <ClientCountArea />
      <EconomyArea />
      <AlgorithmArea />
    </Flex>
  );
}
