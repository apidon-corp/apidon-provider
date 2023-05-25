import AlgorithmArea from "@/Components/Areas/AlgorithmArea/AlgorithmArea";
import ClientCountArea from "@/Components/Areas/ClientStatisticsArea/ClientStatisticsArea";
import EconomyArea from "@/Components/Areas/EconomyArea/EconomyArea";
import OverviewArea from "@/Components/Areas/OverviewArea/OverviewArea";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";

import { Flex } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

export default function Home() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <Flex direction="column" width="100%">
      {currentUserState.isThereCurrentUser && (
        <>
          <OverviewArea />
          <ClientCountArea />
          <EconomyArea />
          <AlgorithmArea />
        </>
      )}
    </Flex>
  );
}
