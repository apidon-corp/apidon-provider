import { auth } from "@/firebase/clientApp";
import { UserCredential, signInWithEmailAndPassword } from "firebase/auth";

export default function useLogin() {
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
