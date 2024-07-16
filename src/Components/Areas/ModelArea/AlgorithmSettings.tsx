import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button, Flex, Input, Text } from '@chakra-ui/react';
import { auth, firestore } from '@/firebase/clientApp';

export default function AlgorithmSettings() {
  const [recencyWeight, setRecencyWeight] = useState(0);
  const [relevanceWeight, setRelevanceWeight] = useState(0);
  const [initialRecencyWeight, setInitialRecencyWeight] = useState(0);
  const [initialRelevanceWeight, setInitialRelevanceWeight] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [initial, setInitial] = useState(false);

  useEffect(() => {
    if (
      recencyWeight === initialRecencyWeight &&
      relevanceWeight === initialRelevanceWeight
    ) {
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [recencyWeight, relevanceWeight, initialRecencyWeight, initialRelevanceWeight]);

  useEffect(() => {
    handleGetInitialDataFromServer();
  }, [initial]);

  const handleGetInitialDataFromServer = async () => {
    setIsLoading(true);
    try {
      const algorithmSettingsDoc = await getDoc(
        doc(
          firestore,
          `users/${auth.currentUser?.displayName}/modelSettings/algorithmSettings`
        )
      );

      if (algorithmSettingsDoc.exists()) {
        const algorithmSettingsData = algorithmSettingsDoc.data();

        setInitialRecencyWeight(algorithmSettingsData.recencyWeight);
        setInitialRelevanceWeight(algorithmSettingsData.relevanceWeight);
        setRecencyWeight(algorithmSettingsData.recencyWeight);
        setRelevanceWeight(algorithmSettingsData.relevanceWeight);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAlgorithmSettings = async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setIsLoading(false);
        return console.error('User is not authenticated');
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch('/api/user/algorithm/updateAlgorithmSettings', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recencyWeight,
          relevanceWeight,
        }),
      });

      if (!response.ok) {
        setIsLoading(false);
        return console.error('Response is not okay', await response.text());
      }

      console.log('API response success: ', await response.text());
    } catch (error) {
      console.error('Request failed: ', error);
    } finally {
      setIsLoading(false);
      setInitial((prev) => !prev);
    }
  };

  const handleCancelAlgorithmSettings = () => {
    setRecencyWeight(initialRecencyWeight);
    setRelevanceWeight(initialRelevanceWeight);
  };

  return (
    <Flex
      id="algorithm-settings"
      direction="column"
      gap="5"
      borderRadius="10px"
      p="2"
      bg="gray.900"
      width="50%"
      justify="center"
      align="center"
    >
      <Text color="gray.500" fontWeight="700" fontSize="20pt" bg="gray.900">
        Update Algorithm Settings
      </Text>
      <Flex display="flex" gap="8pt" align="center" width="100%">
        <Text color="#D69E2E" fontWeight="500" fontSize="15pt" width="40%">
          Recency Weight
        </Text>
        <Input
          width="60%"
          type="number"
          onChange={(e) => setRecencyWeight(Number(e.target.value))}
          value={recencyWeight ?? ''}
          isDisabled={isLoading}
          bg="black"
          color="gray.200"
        />
      </Flex>
      <Flex display="flex" gap="8pt" align="center" width="100%">
        <Text color="#D69E2E" fontWeight="500" fontSize="15pt" width="40%">
          Relevance Weight
        </Text>
        <Input
          width="60%"
          type="number"
          onChange={(e) => setRelevanceWeight(Number(e.target.value))}
          value={relevanceWeight ?? ''}
          isDisabled={isLoading}
          bg="black"
          color="gray.200"
        />
      </Flex>
      <Button
        variant="outline"
        colorScheme="teal"
        size="md"
        onClick={handleUpdateAlgorithmSettings}
        isLoading={isLoading}
        isDisabled={isLoading || isDisabled}
        width="100%"
      >
        Update
      </Button>
      <Button
        variant="outline"
        colorScheme="teal"
        size="md"
        onClick={handleCancelAlgorithmSettings}
        isDisabled={isLoading || isDisabled}
        width="100%"
      >
        Cancel
      </Button>
    </Flex>
  );
}
