import AlgorithmArea from "@/Components/Areas/AlgorithmArea/AlgorithmArea";
import ClientCountArea from "@/Components/Areas/ClientStatisticsArea/ClientStatisticsArea";
import EconomyArea from "@/Components/Areas/EconomyArea/EconomyArea";
import OverviewArea from "@/Components/Areas/OverviewArea/OverviewArea";

import { Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex direction="column" width="100%">
      <OverviewArea />
      <ClientCountArea />
      <EconomyArea />
      <AlgorithmArea />
    </Flex>
  );
}
