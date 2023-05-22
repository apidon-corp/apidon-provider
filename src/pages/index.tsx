import { auth } from "@/Firebase/clientApp";
import { currentUserStateAtom } from "@/atoms/CurrentUserAtom";
import { authenticationModalsStatusAtom } from "@/atoms/authenticationModalsStatusAtom";
import { Button, Flex, useStatStyles } from "@chakra-ui/react";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

export default function Home() {
  const setAuthenticationModalsStatusState = useSetRecoilState(
    authenticationModalsStatusAtom
  );

  const [loading, setLoading] = useState(false);

  const currentUserState = useRecoilValue(currentUserStateAtom);

  return (
    <Flex gap="3">
      <Flex hidden={currentUserState.isThereCurrentUser}>
        <Button
          onClick={() => {
            setAuthenticationModalsStatusState({
              currentPanelName: "login",
              open: true,
            });
          }}
        >
          Log-In
        </Button>
        <Button
          onClick={() => {
            setAuthenticationModalsStatusState({
              currentPanelName: "signup",
              open: true,
            });
          }}
        >
          Sign-Up
        </Button>
      </Flex>

      <Button
        hidden={!currentUserState.isThereCurrentUser}
        onClick={async () => {
          setLoading(true);
          await signOut(auth);
          setLoading(false);
        }}
        isLoading={loading}
        colorScheme="red"
        variant="outline"
      >
        Sign Out
      </Button>
    </Flex>
  );
}
