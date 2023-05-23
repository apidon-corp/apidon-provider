import ClientCountArea from "@/Components/ClientStatisticsArea/ClientStatisticsArea";
import PersonalizationArea from "@/Components/PersonalizationArea/PersonalizationArea";
import { Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex direction="column" width="100%">
      <PersonalizationArea />
      <ClientCountArea />
    </Flex>
  );
}
