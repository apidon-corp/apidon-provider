import ShowcaseArea from "@/Components/Areas/ShowcaseArea/ShowcaseArea";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";

import AlgorithmArea from "@/Components/Areas/AlgorithmArea/AlgorithmArea";
import OfferArea from "@/Components/Areas/OfferArea/OfferArea";
import StatsArea from "@/Components/Areas/StatsArea/StatsArea";
import TopArea from "@/Components/Areas/TopArea/TopArea";
import { Flex } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

export default function Home() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <>
      {currentUserState.isThereCurrentUser && (
        <Flex
          direction="column"
          justify="center"
          align="center"
          width="100%"
          gap="5"
          px="1"
        >
          <TopArea />
          <ShowcaseArea />
          <StatsArea />
          <OfferArea />
          <AlgorithmArea />
        </Flex>
      )}
    </>
  );
}
