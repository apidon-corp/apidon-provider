import { auth } from "@/Firebase/clientApp";

export default function useSetOffer() {
  const setOffer = async (offer: number) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error("Error while setting offer. Couldn't be got idToken", error);
      return false;
    }
    let response;
    try {
      response = await fetch("/api/user/setOffer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ offer: offer }),
      });
    } catch (error) {
      console.error("Error while fetching setOffer API", error);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while setting offer from API.",
        await response.text()
      );
      return false;
    }

    return true;
  };

  return { setOffer };
}
