import { auth, firestore } from "@/firebase/clientApp";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";

import { UserInServer } from "@/types/User";

import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  DocumentData,
  DocumentSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRecoilState } from "recoil";

export default function useLogin() {
  const [currentUserState, setCurrentUserState] =
    useRecoilState(currentUserStateAtom);

  /**
   * Direcly affects auth object.
   * @param email
   * @param password
   * @returns
   */
  const logSignedOutUserIn = async (email: string, password: string) => {
    let userCred: UserCredential;
    try {
      userCred = await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error while logging provider.", error);
      return false;
    }

    return true;

    // logSignedUserIn automatically runs by "Layout"
  };

  return {
    logSignedOutUserIn,
  };
}
