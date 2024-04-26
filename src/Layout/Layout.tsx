import Footer from "@/Components/Footer/Footer";
import LogInModal from "@/Components/Modals/Authentication/LoginModal";
import SignUpModal from "@/Components/Modals/Authentication/SignupModal";
import Navbar from "@/Components/Navbar/Navbar";
import { auth } from "@/firebase/clientApp";
import useLogin from "@/hooks/authHooks/useLogin";
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
          <Image src="/og.png" align="center" width="90px" />
        </Center>
      ) : (
        <Box>
          <Navbar />
          <LogInModal />
          <SignUpModal />
          <Flex justifyContent="center">{children}</Flex>
          <Footer />
        </Box>
      )}
    </>
  );
}
