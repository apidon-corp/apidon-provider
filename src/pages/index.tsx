import ShowcaseArea from "@/Components/Areas/ShowcaseArea/ShowcaseArea";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import AlgorithmArea from "@/Components/Areas/ModelArea/ModelArea";
import OfferArea from "@/Components/Areas/OfferArea/OfferArea";
import StatsArea from "@/Components/Areas/StatsArea/StatsArea";
import TopArea from "@/Components/Areas/TopArea/TopArea";
import { Flex, Text } from "@chakra-ui/react";
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
          width="85%"
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
      {!currentUserState.isThereCurrentUser && (
        <>
          <Flex>
            <Text color="white" fontSize="15pt">
              There is no active user
            </Text>
          </Flex>
        </>
      )}
    </>
  );
}
