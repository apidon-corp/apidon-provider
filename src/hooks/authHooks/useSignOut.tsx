import { auth } from "@/Firebase/clientApp";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";

import { DefaultCurrentUser } from "@/types/User";
import { useSetRecoilState } from "recoil";

export default function useSignOut() {
  const setCurrentUserState = useSetRecoilState(currentUserStateAtom);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.log("Error while signing user out", error);
      return false;
    }

    setCurrentUserState(DefaultCurrentUser);

    return true;
  };

  return {
    handleSignOut,
  };
}
