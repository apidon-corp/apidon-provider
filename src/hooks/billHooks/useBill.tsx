import { auth } from "@/Firebase/clientApp";
import { currentUserStateAtom } from "@/atoms/currentUserStateAtom";
import {
  CalculateBillAPIReponse,
  CheckPaymentRuleAPIRequestBody,
  CheckPaymentRuleAPIResponse,
} from "@/types/Billing";
import { useRecoilValue } from "recoil";

export default function useBill() {
  const currentUserState = useRecoilValue(currentUserStateAtom);

  const checkPaymentRuleStatus = async () => {
    const currentProviderId = currentUserState.name;
    let responseFromAPI: CheckPaymentRuleAPIResponse;

    try {
      const body: CheckPaymentRuleAPIRequestBody = {
        providerId: currentProviderId,
      };
      if (!auth.currentUser) throw new Error("No current user");
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/user/billing/checkPaymentRule", {
        method: "POST",
        headers: {
          authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok)
        throw new Error(
          `Response from checkPaymentRule is not okay: \n ${await response.text()}`
        );
      responseFromAPI = await response.json();
    } catch (error) {
      console.error(
        "Error on 'useBill' hook on 'checkPayment' method: \n ",
        error
      );
      return false;
    }

    return responseFromAPI;
  };

  const calculateBill = async () => {
    try {
      if (!auth.currentUser) throw new Error("No current user");
      const idToken = await auth.currentUser.getIdToken();

      const reponse = await fetch("/api/user/billing/calculateBill", {
        method: "GET",
        headers: {
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!reponse.ok) {
        throw new Error(
          `Response from 'calculateBill' API is not okay:\n ${await reponse.text()}`
        );
      }

      const responseFromAPI = (await reponse.json()) as CalculateBillAPIReponse;

      return responseFromAPI;
    } catch (error) {
      console.error(
        "Error on 'useBill' hook and on 'calculateBill' function: \n",
        error
      );
      return false;
    }
  };

  return { checkPaymentRuleStatus, calculateBill };
}
