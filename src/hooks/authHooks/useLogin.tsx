import { auth, firestore } from "@/Firebase/clientApp";
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

  const logSignedUserIn = async (user: User) => {
    let signedInUserDocSnapshot: DocumentSnapshot<DocumentData>;
    try {
      signedInUserDocSnapshot = await getDoc(
        doc(firestore, `users/${user.displayName}`)
      );
    } catch (error) {
      console.error(
        "Error while log user in. (We were getting doc with userCred.",
        error
      );
      return false;
    }

    if (!signedInUserDocSnapshot.exists()) {
      console.error("Error while login. (User snapshot doesn't exixt)");
      return false;
    }

    const userDataInServer = signedInUserDocSnapshot.data() as UserInServer;

    setCurrentUserState({
      ...userDataInServer,
      isThereCurrentUser: true,
      score: Number(
        ((userDataInServer.sumScore / userDataInServer.rateCount) * 20)
          .toString()
          .slice(0, 4)
      ),
    });

    return true;
  };

  return {
    logSignedOutUserIn,
    logSignedUserIn,
  };
}
