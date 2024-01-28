import ShowcaseArea from "@/Components/Areas/ShowcaseArea/ShowcaseArea";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";

import AlgorithmArea from "@/Components/Areas/AlgorithmArea/AlgorithmArea";
import OfferArea from "@/Components/Areas/OfferArea/OfferArea";
import StatsArea from "@/Components/Areas/StatsArea/StatsArea";
import TopArea from "@/Components/Areas/TopArea/TopArea";
import { Button, Flex } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";
import DeepLearningArea from "@/Components/Areas/DeepLearningArea/DeepLearningArea";

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
          <DeepLearningArea/>
        </Flex>
      )}
      {!currentUserState.isThereCurrentUser && (
        <>
          <Button
            onClick={async () => {
              const response = await fetch("/api/ai/imageClassify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  imagePath:
                    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Haliaeetus_leucocephalus4_%28softeis%29.jpg/800px-Haliaeetus_leucocephalus4_%28softeis%29.jpg",
                }),
              });
              console.log(await response.json());
            }}
          >
            Analyze
          </Button>
        </>
      )}
    </>
  );
}
