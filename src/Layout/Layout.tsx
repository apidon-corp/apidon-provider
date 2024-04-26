import Footer from "@/Components/Footer/Footer";
import LogInModal from "@/Components/Modals/Authentication/LoginModal";
import ResetPasswordModal from "@/Components/Modals/Authentication/PasswordResetModal";
import SignUpModal from "@/Components/Modals/Authentication/SignupModal";
import Navbar from "@/Components/Navbar/Navbar";
import { authenticationModalsStatusAtom } from "@/atoms/authenticationModalsStatusAtom";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import { auth, firestore } from "@/firebase/clientApp";
import { UserInServer } from "@/types/User";
import { Box, Center, Flex, Image } from "@chakra-ui/react";
import { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ReactNode, useEffect, useState } from "react";
import { useRecoilState, useSetRecoilState } from "recoil";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  const [loading, setLoading] = useState(true);

  const [authModalState, setAuthModalState] = useRecoilState(
    authenticationModalsStatusAtom
  );

  const setCurrentUserState = useSetRecoilState(currentUserStateAtom);

  /**
   * Setting width and height for company logo on start screen.
   */
  useEffect(() => {
    // Function to calculate viewport height excluding bottom bars on mobile Safari
    const calculateViewportHeight = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Initial calculation
    calculateViewportHeight();

    // Recalculate on window resize
    window.addEventListener("resize", calculateViewportHeight);

    // Clean up the event listener
    return () => {
      window.removeEventListener("resize", calculateViewportHeight);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        // User is signed in.
        handleAfterSuccessfullAuth(user);
      } else {
        // User is signed out.
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Cleanup the event listener when component unmounts
  }, []);

  const handleAfterSuccessfullAuth = async (user: User) => {
    if (!user.displayName) {
      console.error("User's has no displayName property in its auth object.");
      return setAuthModalState({ open: true, view: "login" });
    }

    const username = user.displayName;

    try {
      const userDocSnapshot = await getDoc(doc(firestore, `users/${username}`));

      if (!userDocSnapshot.exists()) {
        console.error("User's doc in firestore doesn't exist.");
        return setAuthModalState({ open: true, view: "login" });
      }

      const userDocData = userDocSnapshot.data() as UserInServer;

      const sumScore = userDocData.sumScore;
      const rateCount = userDocData.rateCount;

      let score = Number(
        ((userDocData.sumScore / userDocData.rateCount) * 20)
          .toString()
          .slice(0, 4)
      );

      score = rateCount === 0 ? 0 : (sumScore / rateCount) * 20;

      setCurrentUserState({
        ...userDocData,
        isThereCurrentUser: true,
        score: score,
      });

      // Update States
      setAuthModalState({ open: false, view: "login" });
      setLoading(false);

      return;
    } catch (error) {
      console.error(
        "Error while preparing user for platform after successfull auth: \n",
        error
      );
      return setAuthModalState({ open: true, view: "login" });
    }
  };

  return (
    <>
      {loading ? (
        <Center height="100vh">
          <Image src="/og.png" align="center" width="90px" />
        </Center>
      ) : (
        <Box>
          <Navbar />
          {authModalState.open && authModalState.view === "login" && (
            <LogInModal />
          )}
          {authModalState.open && authModalState.view === "signup" && (
            <SignUpModal />
          )}
          {authModalState.open && authModalState.view === "resetPassword" && (
            <ResetPasswordModal />
          )}
          <Flex justifyContent="center">{children}</Flex>
          <Footer />
        </Box>
      )}
    </>
  );
}
