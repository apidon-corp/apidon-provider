import GeneralAuthenticationModals from "@/Components/Modals/Authentication/GeneralAuthenticationModals";
import { auth } from "@/Firebase/clientApp";
import useLogin from "@/hooks/useLogin";
import { Box, Center, Flex, Image } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const { logSignedUserIn } = useLogin();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        console.log("We have user!");
        await logSignedUserIn(user);
        console.log("User has been initialized.");
        setLoading(false);
      } else {
        console.log("We don't have user");
        setLoading(false);
        // User is signed out, handle the signed-out state
      }
    });

    return () => unsubscribe(); // Cleanup the event listener when component unmounts
  }, []);

  return (
    <>
      {loading ? (
        <Center height="100vh">
          <Image src="/bsicon.jpg" align="center" width="90px" />
        </Center>
      ) : (
        <Box>
          <GeneralAuthenticationModals />
          <Flex justifyContent="center">{children}</Flex>
        </Box>
      )}
    </>
  );
}
