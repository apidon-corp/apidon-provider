import { billingModalStatusAtom } from "@/atoms/billingModalStatusAtom";
import useBill from "@/hooks/billHooks/useBill";
import {
  CalculateBillAPIReponse,
  CreatePaymentRuleAPIRequestBody,
  CreatePaymentRuleAPIResponse,
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

import { ethers } from "ethers";
import { BiError } from "react-icons/bi";

type Props = {
  handleIntegrateModel: () => Promise<void>;
};

export default function BillingModal({ handleIntegrateModel }: Props) {
  const [billingModalState, setBillingModalState] = useRecoilState(
    billingModalStatusAtom
  );

  const {
    checkPaymentRuleStatus,
    calculateBill,
    createPaymentRule,
    cancelBill,
  } = useBill();

  const [calculatedBill, setCalculatedBill] = useState<CalculateBillAPIReponse>(
    { postCount: 0, totalPrice: 0, currency: "dollar", pricePerPost: 0 }
  );

  const [createPaymentInputState, setCreatePaymentInputState] =
    useState<CreatePaymentRuleAPIRequestBody>({
      payerAddress: "",
    });

  const [payerAddressRight, setPayerAddressRight] = useState(true);
  const payerAddressInputRef = useRef<HTMLInputElement>(null);

  const [createPaymentRuleLoading, setCreatePaymentRuleLoading] =
    useState(false);

  const [billingModalViewState, setBillingModalViewState] = useState<
    | "initialLoading"
    | "calculateBill"
    | "verifyingPayment"
    | "paymentVerified"
    | "paymentCancelling"
    | "modelIntegrating"
  >("initialLoading");

  const [createdPaymentRuleState, setCreatedPaymentRuleState] =
    useState<CreatePaymentRuleAPIResponse>({
      active: false,
      due: 0,
      id: "",
      occured: false,
      payer: "",
      price: 0,
      integrationStarted: false,
    });

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

  useEffect(() => {
    if (billingModalViewState === "initialLoading") checkInitialStatus();
  }, [billingModalViewState]);

  useEffect(() => {
    if (billingModalViewState !== "verifyingPayment") return;
    const seconds = 1000;
    const interval = setInterval(handleCheckPaymentStatus, 10 * seconds);
    return () => clearInterval(interval);
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

    // I put '!operationResult.activePaymentRuleData' to make TypeScript comfortable.
    if (
      operationResult.thereIsNoActivePaymentRule ||
      !operationResult.activePaymentRuleData
    ) {
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

    setCreatedPaymentRuleState({
      active: true,
      due: operationResult.activePaymentRuleData.due,
      id: operationResult.activePaymentRuleData.id,
      occured: operationResult.activePaymentRuleData.occured,
      payer: operationResult.activePaymentRuleData.payer,
      price: operationResult.activePaymentRuleData.price,
      integrationStarted:
        operationResult.activePaymentRuleData.integrationStarted,
    });

    if (!operationResult.activePaymentRuleData.occured) {
      return setBillingModalViewState("verifyingPayment");
    }

    if (operationResult.activePaymentRuleData.occured) {
      // Show status of payment rule and show 'finish model changes!' button. and we convert active field to false.
      if (!operationResult.activePaymentRuleData.integrationStarted)
        return setBillingModalViewState("paymentVerified");
      if (operationResult.activePaymentRuleData.integrationStarted)
        return setBillingModalViewState("modelIntegrating");
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
      setCreatePaymentRuleLoading(false);
      setBillingModalViewState("initialLoading");
      return;
    }
    setCreatedPaymentRuleState(operationResult);

    // Automatically switch to payment waiting window or verifying.
    setBillingModalViewState("initialLoading");

    // Turn off the spinner
    return setCreatePaymentRuleLoading(false);
  };

  const handleCancelButton = async () => {
    setBillingModalViewState("paymentCancelling");

    const operationResult = await cancelBill();
    if (!operationResult) {
      // Continue to show verifying page. But not with cancel payment loading button.
      setBillingModalViewState("verifyingPayment");
      return;
    }

    // Return the calculation of payment.
    setBillingModalViewState("initialLoading");
  };

  const handleCheckPaymentStatus = async () => {
    const operationResult = await checkPaymentRuleStatus();

    if (!operationResult) {
      return false;
    }

    if (
      operationResult.thereIsNoActivePaymentRule ||
      !operationResult.activePaymentRuleData
    )
      return false;

    console.log(
      "Occured Status:  ",
      operationResult.activePaymentRuleData.occured
    );

    if (operationResult.activePaymentRuleData.occured)
      setBillingModalViewState("initialLoading");

    return operationResult.activePaymentRuleData.occured;
  };

  const handleIntegrateModelButton = async () => {
    setBillingModalViewState("modelIntegrating");
    console.log("Integration started from -billingmodal");
    await handleIntegrateModel();
    console.log("Integration finished from -billingmodal");

    setBillingModalViewState("initialLoading");
    setBillingModalState({
      isOpen: false,
    });
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
        if (
          billingModalViewState === "paymentCancelling" ||
          billingModalViewState === "verifyingPayment" ||
          billingModalViewState === "paymentVerified"
        )
          return;
        setBillingModalState({ isOpen: false });
      }}
      autoFocus={false}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="5px" />
      <ModalContent
        bg="#1A1A1A"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Billing Panel</ModalHeader>
        <ModalCloseButton
          color="white"
          hidden={
            billingModalViewState === "paymentCancelling" ||
            billingModalViewState === "verifyingPayment" ||
            billingModalViewState === "paymentVerified"
          }
        />
        <ModalBody display="flex">
          {billingModalViewState === "initialLoading" && (
            <>
              <Spinner color="gray.500" width="50pt" height="50pt" />
            </>
          )}

          {billingModalViewState === "calculateBill" && (
            <Flex id="calculate-bill-flex" direction="column" gap="20px">
              <Text color="white" fontSize="15pt" fontWeight="700">
                Invoice
              </Text>
              <Flex id="receipt-content" width="100%" justify="space-between">
                <Flex
                  id="post-count"
                  align="center"
                  gap="3px"
                  direction="column"
                  border="1px solid gray"
                  borderRadius="10px"
                  p="5px"
                  width="120px"
                >
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Post Count
                  </Text>
                  <Text color="gray.100" fontSize="10pt" fontWeight="700">
                    {calculatedBill.postCount}
                  </Text>
                </Flex>
                <Flex id="cross" align="center">
                  <Text color="gray.100" fontSize="10pt" fontWeight="700">
                    x
                  </Text>
                </Flex>
                <Flex
                  id="price-per-post"
                  align="center"
                  gap="3px"
                  direction="column"
                  border="1px solid gray"
                  borderRadius="10px"
                  p="5px"
                  width="120px"
                >
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Price Per Post
                  </Text>
                  <Text color="gray.100" fontSize="10pt" fontWeight="700">
                    {calculatedBill.pricePerPost} (MATIC)
                  </Text>
                </Flex>
                <Flex id="equal" align="center">
                  <Text color="gray.100" fontSize="10pt" fontWeight="700">
                    =
                  </Text>
                </Flex>
                <Flex
                  id="total-amount"
                  align="center"
                  gap="3px"
                  direction="column"
                  border="1px solid gray"
                  borderRadius="10px"
                  p="5px"
                  width="120px"
                >
                  <Text color="gray.500" fontSize="10pt" fontWeight="600">
                    Total
                  </Text>
                  <Text color="gray.100" fontSize="10pt" fontWeight="700">
                    {calculatedBill.totalPrice} (MATIC)
                  </Text>
                </Flex>
              </Flex>

              <Flex
                id="disclaimer"
                align="center"
                width="100%"
                direction="column"
                gap="8px"
              >
                <Text color="yellow.600" fontSize="8pt" fontWeight="600">
                  This price reflects an estimated cost based on current post
                  count availability. Due to the dynamic nature of our
                  inventory, the final price may be subject to adjustments
                  depending on the actual post count at checkout.
                </Text>
                <Text color="yellow.600" fontSize="8pt" fontWeight="600">
                  Review the final price displayed during checkout before
                  confirming your order.
                </Text>
              </Flex>

              <Flex id="create-payment-part" direction="column" gap="5px">
                <Text color="white" fontSize="15pt" fontWeight="700">
                  Payment Rule Creation
                </Text>
                <Flex id="payer-address-part" direction="column" gap="15px">
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
                        bg="#1A1A1A"
                        spellCheck={false}
                        isRequired
                      />
                      <FormLabel
                        bg="#1A1A1A"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Payer Address
                      </FormLabel>
                    </FormControl>
                    <InputRightElement
                      hidden={createPaymentInputState.payerAddress.length === 0}
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
                    isDisabled={!payerAddressRight}
                  >
                    Create Payment
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          )}

          {billingModalViewState === "verifyingPayment" && (
            <Flex
              width="100%"
              id="verifying-payment-flex"
              direction="column"
              gap="20px"
              align="center"
              justify="center"
            >
              <Spinner color="teal" width="50pt" height="50pt" />
              <Text color="white" fontSize="15pt" fontWeight="700">
                Waiting for your payment...
              </Text>
              <Flex
                id="Payment-Details"
                direction="column"
                width="90%"
                overflow="auto"
              >
                <Flex id="payment-id" align="center" gap="5px">
                  <Text color="gray.500" fontSize="9pt" fontWeight="600">
                    Payment ID:
                  </Text>
                  <Text color="gray.100" fontSize="9pt" fontWeight="700">
                    {createdPaymentRuleState.id}
                  </Text>
                </Flex>

                <Flex id="total-price" align="center" gap="5px">
                  <Text color="gray.500" fontSize="9pt" fontWeight="600">
                    Amount:
                  </Text>
                  <Text color="gray.100" fontSize="9pt" fontWeight="700">
                    {createdPaymentRuleState.price} (MATIC)
                  </Text>
                </Flex>

                <Flex id="due-date" align="center" gap="5px">
                  <Text color="gray.500" fontSize="9pt" fontWeight="600">
                    Due Date:
                  </Text>
                  <Text color="gray.100" fontSize="9pt" fontWeight="700">
                    {new Date(createdPaymentRuleState.due).toLocaleString()}
                  </Text>
                </Flex>

                <Flex id="payer-address" align="center" gap="5px">
                  <Text color="gray.500" fontSize="9pt" fontWeight="600">
                    Payer:
                  </Text>
                  <Text color="gray.100" fontSize="9pt" fontWeight="700">
                    {createdPaymentRuleState.payer}
                  </Text>
                </Flex>
              </Flex>
              <Flex id="cancel-payment" mt="10px">
                <Button
                  variant="outline"
                  colorScheme="red"
                  size="sm"
                  onClick={() => {
                    handleCancelButton();
                  }}
                >
                  Cancel Payment
                </Button>
              </Flex>
            </Flex>
          )}

          {billingModalViewState === "paymentCancelling" && (
            <Flex
              width="100%"
              id="cancelling-payment-flex"
              direction="column"
              gap="20px"
              align="center"
              justify="center"
            >
              <Spinner color="red" width="50pt" height="50pt" />
              <Text color="white" fontSize="15pt" fontWeight="700">
                Cancelling Your Payment
              </Text>
            </Flex>
          )}

          {billingModalViewState === "paymentVerified" && (
            <Flex id="paymentVerified-flex" direction="column" gap="10px">
              <Text color="white" fontSize="15pt" fontWeight="700">
                Integrate Model
              </Text>

              <Text color="green.500" fontSize="10pt" fontWeight="600">
                Your payment is successfully occurred.
              </Text>
              <Text color="yellow.600" fontSize="9pt" fontWeight="600">
                Once your model is integrated into the Apidon platform, it is
                disconnected from the outside world. In this way, even the
                developers of your model cannot access the data of the users.
              </Text>

              <Text color="yellow.600" fontSize="9pt" fontWeight="600">
                It is important that your model does not infringe legal rights
                such as copyright, patents or trade secrets.
              </Text>

              <Text color="yellow.600" fontSize="9pt" fontWeight="600">
                The evaluation process of your model can take between 1-2 weeks.
              </Text>

              <Text color="yellow.600" fontSize="9pt" fontWeight="600">
                You can remove your model from the platform at any time.
              </Text>

              <Text color="yellow.600" fontSize="9pt" fontWeight="600">
                Uploading a model to the Apidon platform means that you agree
                that your model meets all the criteria mentioned above. Apidon
                cannot be held responsible for any data breach, ethical
                violation or legal violation caused by your model.
              </Text>
              <Flex
                id="integrate-your-model-button"
                width="100%"
                align="center"
                justify="center"
                mt={5}
              >
                <Button
                  variant="solid"
                  colorScheme="green"
                  size="md"
                  onClick={() => {
                    handleIntegrateModelButton();
                  }}
                >
                  Integrate Your Model
                </Button>
              </Flex>
            </Flex>
          )}

          {billingModalViewState == "modelIntegrating" && (
            <Flex
              id="model-integrating-flex"
              direction="column"
              gap="20px"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner color="green" width="50pt" height="50pt" />
              <Text color="white" fontSize="15pt" fontWeight="700">
                Integrating Model
              </Text>

              {/* <Flex
                id="model-integration-detail"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Flex
                  id="model-uploading-firebase-detail"
                  gap="5px"
                  align="center"
                  justify="center"
                  color="yellow.500"
                >
                  <Icon fontSize="12pt" as={AiOutlineCheckCircle} />
                  <Text fontSize="9pt">Model Uploading</Text>
                </Flex>
                <Flex
                  id="model-settings-upload-firebase-detail"
                  gap="5px"
                  align="center"
                  justify="center"
                  color="gray.500"
                >
                  <Icon fontSize="12pt" as={AiOutlineCheckCircle} />
                  <Text fontSize="9pt">Model Settings Uploading</Text>
                </Flex>
                <Flex
                  id="connecting-with-apis"
                  gap="5px"
                  align="center"
                  justify="center"
                  color="gray.500"
                >
                  <Icon fontSize="12pt" as={AiOutlineCheckCircle} />
                  <Text fontSize="9pt">Connecting with APIs</Text>
                </Flex>
                <Flex
                  id=""
                  gap="5px"
                  align="center"
                  justify="center"
                  color="gray.500"
                >
                  <Icon fontSize="12pt" as={AiOutlineCheckCircle} />
                  <Text fontSize="9pt">Analyzing Platform Data</Text>
                </Flex>
              </Flex> */}
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
