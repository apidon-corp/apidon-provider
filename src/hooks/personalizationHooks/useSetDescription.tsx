import { auth } from "@/Firebase/clientApp";

export default function useSetDescription() {
  const handleUpdateDescription = async (description: string) => {
    let idToken = "";
    try {
      idToken = (await auth.currentUser?.getIdToken()) as string;
    } catch (error) {
      console.error(
        "Error while setting description. Couln't be got idToken",
        error
      );
      return false;
    }
    let response;
    try {
      response = await fetch("/api/setDescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ description: description }),
      });
    } catch (error) {
      console.error("Error while fetching setDescription API", error);
      return false;
    }

    if (!response.ok) {
      console.error(
        "Error while setting description from API.",
        await response.text()
      );
      return false;
    }

    return true;
  };

  return { handleUpdateDescription };
}
