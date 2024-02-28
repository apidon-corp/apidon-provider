import { billingModalStatusAtom } from "@/atoms/billingModalStatusAtom";
import useBill from "@/hooks/billHooks/useBill";
import {
  CalculateBillAPIReponse,
  CheckPaymentRuleAPIResponse,
  CreatePaymentRuleAPIRequestBody,
} from "@/types/Billing";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { useRecoilState } from "recoil";

import { BiError } from "react-icons/bi";
import { ethers } from "ethers";

export default function BillingModal() {
  const [billingModalState, setBillingModalState] = useRecoilState(
    billingModalStatusAtom
  );

  const { checkPaymentRuleStatus, calculateBill, createPaymentRule } =
    useBill();

  const [calculatedBill, setCalculatedBill] = useState<CalculateBillAPIReponse>(
    { postCount: 0, totalPrice: 0, currency: "dollar", pricePerPost: 0 }
  );

  const [paymentRuleStatusState, setPaymentRuleStatusState] =
    useState<CheckPaymentRuleAPIResponse>({
      occured: false,
      thereIsNoActivePaymentRule: true,
    });

  const [createPaymentInputState, setCreatePaymentInputState] =
    useState<CreatePaymentRuleAPIRequestBody>({
      payerAddress: "",
    });

  const [payerAddressRight, setPayerAddressRight] = useState(true);
  const payerAddressInputRef = useRef<HTMLInputElement>(null);

  const [createPaymentRuleLoading, setCreatePaymentRuleLoading] =
    useState(false);

  const [billingModalViewState, setBillingModalViewState] = useState<
    "initialLoading" | "calculateBill" | "verifyingPayment" | "paymentVerified"
  >("initialLoading");

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
    checkInitialStatus();
  }, [billingModalState.isOpen]);

  useEffect(() => {
    if (
      billingModalViewState === "verifyingPayment" ||
      billingModalViewState === "paymentVerified"
    )
      setBillingModalState({ isOpen: true });
  }, [billingModalViewState]);

  const checkInitialStatus = async () => {
    setBillingModalViewState("initialLoading");

    const operationResult = await checkPaymentRuleStatus();

    if (!operationResult) {
      console.log(
        "Operation result is good from 'checkPaymentRuleStatus' hook."
      );
      return;
    }

    setPaymentRuleStatusState(operationResult);

    if (operationResult.thereIsNoActivePaymentRule) {
      // Calculate Bill
      const calculatedBillResult = await handleCalculateBill();

      if (!calculatedBillResult) {
        console.log(
          "Calculate bill result is false from 'calculateBill' hook."
        );
        return setBillingModalViewState("initialLoading");
      }

      setCalculatedBill(calculatedBillResult);

      return setBillingModalViewState("calculateBill");
    }

    if (!operationResult.occured) {
      // Show Status of Payment Rule
      return setBillingModalViewState("verifyingPayment");
    }

    if (operationResult.occured) {
      // Show status of payment rule and show 'finish model changes!' button. and we convert active field to false.
      return setBillingModalViewState("paymentVerified");
    }
  };

  const handleCalculateBill = async () => {
    const operationResult = await calculateBill();
    return operationResult;
  };

  const handlePayerAddressChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const addressInput = event.target.value;

    if (addressInput.length === 0) {
      // prevent bad ui
      setPayerAddressRight(true);
      setCreatePaymentInputState({
        payerAddress: addressInput,
      });
      return;
    }

    const addressValidationResult = ethers.isAddress(addressInput);
    setPayerAddressRight(addressValidationResult);

    if (addressValidationResult) {
      if (payerAddressInputRef.current) {
        payerAddressInputRef.current.blur();
      }
    }
    if (addressValidationResult && !addressInput.startsWith("0x")) {
      setCreatePaymentInputState({
        payerAddress: `0x${addressInput}`,
      });
      return;
    }
    setCreatePaymentInputState({
      payerAddress: addressInput,
    });
  };

  const handleCreatePaymentButton = async () => {
    // Turn on the spinner
    setCreatePaymentRuleLoading(true);

    const operationResult = await createPaymentRule(createPaymentInputState);

    if (!operationResult) {
      // There was an error while creating payment rule.
      // I didn't decide to show the user error or not.
      // So, I leave the spinner on for now.
      return;
    }

    // Automatically switch to payment waiting window or verifying.

    console.log(operationResult);

    // Turn off the spinner
    return setCreatePaymentRuleLoading(false);
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
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Billing Panel</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          {billingModalViewState === "initialLoading" && (
            <>
              <Spinner color="gray.500" width="50pt" height="50pt" />
            </>
          )}

          {billingModalViewState === "calculateBill" && (
            <>
              <Flex
                direction="column"
                gap="10px"
                id="there-is-no-active-payment-rule-flex"
              >
                <Flex id="receipt-content" direction="column">
                  <Text color="white" fontSize="15pt" fontWeight="700">
                    Your Receipt
                  </Text>
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
                      {calculatedBill.totalPrice}
                    </Text>
                  </Flex>
                  <Flex id="currency" align="center" gap="5px">
                    <Text color="gray.500" fontSize="10pt" fontWeight="600">
                      Currency:
                    </Text>
                    <Text color="white">{calculatedBill.currency}</Text>
                  </Flex>
                </Flex>

                <Flex id="create-payment-part" direction="column">
                  <Text color="white" fontSize="15pt" fontWeight="700">
                    Payment Rule Creation
                  </Text>
                  <Flex id="wallet-address-part" direction="column" gap="10px">
                    <Text color="yellow.600" fontSize="8pt" fontWeight="600">
                      Plesae provide a "payer" address. Note that, you can only
                      make payment with the address you will provide.
                    </Text>
                    <InputGroup>
                      <FormControl variant="floating">
                        <Input
                          fontSize="10pt"
                          required
                          name="payer-address"
                          placeholder=" "
                          mb={2}
                          pr={"9"}
                          onChange={handlePayerAddressChange}
                          value={createPaymentInputState.payerAddress}
                          _hover={{
                            border: "1px solid",
                            borderColor: "blue.500",
                          }}
                          textColor="white"
                          bg="black"
                          spellCheck={false}
                          isRequired
                        />
                        <FormLabel
                          bg="rgba(0,0,0)"
                          textColor="gray.500"
                          fontSize="12pt"
                          my={2}
                        >
                          Payer Address
                        </FormLabel>
                      </FormControl>
                      <InputRightElement
                        hidden={
                          createPaymentInputState.payerAddress.length === 0
                        }
                      >
                        {!payerAddressRight ? (
                          <Icon as={BiError} fontSize="20px" color="red" />
                        ) : (
                          <Icon
                            as={AiOutlineCheckCircle}
                            fontSize="20px"
                            color="green"
                          />
                        )}
                      </InputRightElement>
                    </InputGroup>
                  </Flex>
                  <Flex id="button" align="center" justify="center">
                    <Button
                      variant="outline"
                      colorScheme="blue"
                      size="sm"
                      isLoading={createPaymentRuleLoading}
                      onClick={() => {
                        handleCreatePaymentButton();
                      }}
                    >
                      Create Payment
                    </Button>
                  </Flex>
                </Flex>
              </Flex>
            </>
          )}

          {billingModalViewState === "verifyingPayment" && (
            <>
              <Flex id="there-is-active-payment-rule-flex">
                <Text color="white" fontSize="15pt" fontWeight="700">
                  Waiting for your payment...
                </Text>
              </Flex>
            </>
          )}

          {billingModalViewState === "paymentVerified" && (
            <>
              <Flex id="there-is-active-payment-rule-flex">
                <Text color="white" fontSize="15pt" fontWeight="700">
                  Payment Verified
                </Text>
              </Flex>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
