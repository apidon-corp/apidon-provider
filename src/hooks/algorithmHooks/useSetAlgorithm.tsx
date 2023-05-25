import { auth } from "@/Firebase/clientApp";

export default function useSetAlgorithm() {
  const setAlgorithm = async (algorithm: string) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error while setting algorithm. Couln't be got idToken",
        error
      );
      return false;
    }
    let response;
    try {
      response = await fetch("/api/user/setAlgorithm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ algorithm: algorithm }),
      });
    } catch (error) {
      console.error("Error while fetching setAlgorithm API", error);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while setting algorithm from API.",
        await response.text()
      );
      return false;
    }

    return true;
  };

  return {
    setAlgorithm,
  };
}
