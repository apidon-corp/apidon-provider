import { billingModalStatusAtom } from "@/atoms/billingModalStatusAtom";
import useBill from "@/hooks/billHooks/useBill";
import { CalculateBillAPIReponse } from "@/types/Billing";
import {
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

type Props = {};

export default function BillingModal({}: Props) {
  const [billingModalState, setBillingModalState] = useRecoilState(
    billingModalStatusAtom
  );

  const { checkPaymentRuleStatus, calculateBill } = useBill();

  const [initialLoadingStatus, setInitialLoadingStatus] = useState(true);

  const [calculatedBill, setCalculatedBill] = useState<CalculateBillAPIReponse>(
    { postCount: 0, amount: 0, currency: "dollar", pricePerPost: 0 }
  );

  /**
   * 1-) Calculate Billing and show "Proceed" button.
   * 2-) If provider press "proceed" button get input of its "walletAddress" and show "Create Payment Rule"
   * 3-) If provider press create payment rule, create payment rule...
   * 4-) Show user current status of payment rule and "cancel" buttons....
   * 5-) If user presses "cancel" button update "Payment Rule Object's active field to false.
   * 5-) When payment verified, show "upload model now!" button to provider.
   * 6-) Upload Model...
   */

  /**
   * 1-) Check at start If there is already active payment rule. (check active status of docs...)
   *  1.1-) If there is show "pay" and "cancel" button.
   *  1.2-) If not, calculate billing and ask.
   */

  /**
   * 1-) One provider can only have just one active payment rule at the same time.
   */

  /** Payment Rule Object in Database
   * active : boolean,
   * amount : number,
   * due : number,
   * id : string, (this will be created [providerId]-[documentId])
   * occured : boolean, (If payment was sucessfull)
   * receipent : string (wallet address)
   */

  /**
   * Payment rule object will be stored in `/users/[providerId]/bills/[documentId](auto-generated)`.
   */

  /** API's that will be needed:
   * 1-) Create Payment Rule
   * 2-) Check Payment Rule Status
   * 3-) Cancel Payment Rule
   * 4-= Calculate Bill
   */

  useEffect(() => {
    if (!billingModalState.isOpen) return;
    checkInitialStatus();
  }, [billingModalState.isOpen]);

  useEffect(() => {
    if (!billingModalState.isOpen) return;
    console.log(calculatedBill);
  }, [calculatedBill]);

  const checkInitialStatus = async () => {
    setInitialLoadingStatus(true);

    const operationResult = await checkPaymentRuleStatus();

    if (!operationResult) {
      console.log(
        "Operation result is good from 'checkPaymentRuleStatus' hook."
      );
      return setInitialLoadingStatus(true); // Yeah it will stay true, because it is not expected..... // Or we can show error to user.
    }

    if (operationResult.thereIsNoActivePaymentRule) {
      // Calculate Bill

      const calculatedBillResult = await handleCalculateBill();

      if (!calculatedBillResult) {
        console.log(
          "Calculate bill result is false from 'calculateBill' hook."
        );
        return setInitialLoadingStatus(true);
      }

      setCalculatedBill(calculatedBillResult);
      return setInitialLoadingStatus(false);
    }

    if (!operationResult.occured) {
      // Show Status of Payment Rule
      return;
    }

    if (operationResult.occured) {
      // Show status of payment rule and show 'finish model changes!' button.
      return;
    }
  };

  const handleCalculateBill = async () => {
    const operationResult = await calculateBill();
    return operationResult;
  };

  return (
    <Modal
      id="billing_modal"
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={billingModalState.isOpen}
      onClose={() => {
        setBillingModalState({ isOpen: false });
      }}
      autoFocus={false}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="5px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          large: "500px",
        }}
      >
        <ModalHeader color="white">Billing Panel</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          {initialLoadingStatus ? (
            <>
              <Spinner color="gray.500" width="50pt" height="50pt" />
            </>
          ) : (
            <>
              <Flex direction="column" gap="5px">
                <Text color="white" fontSize="15pt" fontWeight="700">
                  Your Receipt
                </Text>
                <Flex id="receipt-content" direction="column">
                  <Flex id="post-count" align="center" gap="5px">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Post Count:
                    </Text>
                    <Text color="gray.100" fontSize="10pt" fontWeight="700">
                      {calculatedBill.postCount}
                    </Text>
                  </Flex>
                  <Flex id="price-per-post" align="center" gap="5px">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Price Per Post:
                    </Text>
                    <Text color="gray.100" fontSize="10pt" fontWeight="700">
                      {calculatedBill.pricePerPost}
                    </Text>
                  </Flex>
                  <Flex id="total-amount" align="center" gap="5px">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Total:
                    </Text>
                    <Text color="gray.100" fontSize="10pt" fontWeight="700">
                      {calculatedBill.amount}
                    </Text>
                  </Flex>
                  <Flex id="currency" align="center" gap="5px">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Currency:
                    </Text>
                    <Text color="white">{calculatedBill.currency}</Text>
                  </Flex>
                </Flex>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
