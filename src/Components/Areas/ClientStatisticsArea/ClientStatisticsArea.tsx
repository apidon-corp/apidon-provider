import { Flex, Spinner, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { ClientCountAreaGraph } from "./ClientCountAreaGraph";
import { ClientAdEntertainmentRateGraph } from "./ClientAdEntertainmentRateGraph";
import {
  DocumentData,
  QuerySnapshot,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { firestore } from "@/Firebase/clientApp";
import { useRecoilValue } from "recoil";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import moment from "moment";

export default function ClientCountArea() {
  const [isClientStatisticsLoading, setIsClientStatisticsLoading] =
    useState(true);

  const currentUserState = useRecoilValue(currentUserStateAtom);

  const [clientCountGraphData, setClientCountGraphData] = useState<{
    x: string[];
    y: number[];
  }>({
    x: ["a"],
    y: [1],
  });

  useEffect(() => {
    handleGetClientStatistics();
  }, []);

  const handleGetClientStatistics = async () => {
    setIsClientStatisticsLoading(true);

    let clientsQuerySnapshot: QuerySnapshot<DocumentData>;
    try {
      clientsQuerySnapshot = await getDocs(
        query(
          collection(firestore, `users/${currentUserState.name}/clients`),
          where("active", "==", true)
        )
      );
    } catch (error) {
      console.error("Error while getting client statistics", error);
      return false;
    }

    let tempClientGraphData: {
      x: string[];
      y: number[];
    } = {
      x: [],
      y: [],
    };
    for (const clientDocData of clientsQuerySnapshot.docs) {
      const label = moment(clientDocData.data().startTime)
        .format("MMMM YYYY")
        .split(" ")[0];

      const labelIndex = tempClientGraphData.x.indexOf(label);

      if (labelIndex === -1) {
        tempClientGraphData.x.push(label);
        tempClientGraphData.y.push(1);
      } else {
        tempClientGraphData.y[labelIndex]++;
      }
    }

    setClientCountGraphData(tempClientGraphData);

    setIsClientStatisticsLoading(false);
  };

  return (
    <Flex height="60vh" bg="gray.200">
      <Flex
        hidden={!isClientStatisticsLoading}
        align="center"
        justify="center"
        width="100%"
      >
        <Spinner size="xl" color="black" />
      </Flex>
      <Flex
        direction="column"
        gap="1"
        align="center"
        width="100%"
        overflowX="auto"
        hidden={isClientStatisticsLoading}
      >
        <Text color="black" fontSize="20pt" fontWeight="700">
          Client Statistics
        </Text>
        <Flex height="50vh" gap="2">
          <ClientCountAreaGraph clientCountData={clientCountGraphData} />
          <ClientAdEntertainmentRateGraph />
        </Flex>
      </Flex>
    </Flex>
  );
}
