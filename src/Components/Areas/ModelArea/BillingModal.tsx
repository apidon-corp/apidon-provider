import { billingModalStatusAtom } from "@/atoms/billingModalStatusAtom";
import useBill from "@/hooks/billHooks/useBill";
import {
  CalculateBillAPIReponse,
  CreatePaymentRuleAPIRequestBody,
  CreatePaymentRuleAPIResponse,
} from "@/types/Billing";
import {
  Button,
  CircularProgress,
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
  Select,
  Spinner,
  Text,
} from "@chakra-ui/react";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { useRecoilState } from "recoil";

import { auth, ref, storage } from "@/firebase/clientApp";
import {
  ModelSettings,
  TempModelSettings,
  TempModelSettingsPlaceholder,
} from "@/types/Model";
import { ethers } from "ethers";
import { getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { BiError } from "react-icons/bi";

export default function BillingModal() {
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
    | "uploadModel"
    | "uploadingModel"
    | "calculateBill"
    | "verifyingPayment"
    | "paymentCancelling"
    | "integrateModel"
    | "integratingModel"
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

  const [modelUploadSettingsState, setModelUploadSettingsState] =
    useState<TempModelSettings>(TempModelSettingsPlaceholder);
  const modelInputRef = useRef<HTMLInputElement>(null);

  const [modelUploadProgress, setModelUploadProgress] = useState(0);

  // Initial Checking
  useEffect(() => {
    checkInitialStatus();
  }, [billingModalState.isOpen]);

  // Open billing model if payment verified at start
  useEffect(() => {
    if (
      !(
        billingModalViewState === "initialLoading" ||
        billingModalViewState === "uploadModel"
      )
    )
      setBillingModalState({ isOpen: true });
  }, [billingModalViewState]);

  // Check initial status when state changes to initial loading
  useEffect(() => {
    if (billingModalViewState === "initialLoading") checkInitialStatus();
  }, [billingModalViewState]);

  // Check payment status for every ten seconds.
  useEffect(() => {
    if (billingModalViewState !== "verifyingPayment") return;
    const seconds = 1000;
    const interval = setInterval(handleCheckPaymentStatus, 10 * seconds);
    return () => clearInterval(interval);
  }, [billingModalViewState]);

  const checkInitialStatus = async () => {
    /**
     * Check if there is an active payment rule.
     * If there is not payment rule, check model upload status.
     * If there is no model upload, open model upload panel.
     * If there is a model uploaded, open create payment rule panel.
     * If user wants to go back, delete temp files on firebase.
     * If user made payment, open integrate panel.
     */
    setBillingModalViewState("initialLoading");

    const operationResult = await checkPaymentRuleStatus();

    if (!operationResult) {
      console.log(
        "Operation result is good from 'checkPaymentRuleStatus' hook."
      );
      return;
    }

    // Putting '!operationResult.activePaymentRuleData' to make TypeScript comfortable.
    if (
      operationResult.thereIsNoActivePaymentRule ||
      !operationResult.activePaymentRuleData
    ) {
      if (operationResult.areThereTempModelFiles) {
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
      } else {
        // Open upload model panel.
        return setBillingModalViewState("uploadModel");
      }
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
        return setBillingModalViewState("integrateModel");
      if (operationResult.activePaymentRuleData.integrationStarted)
        return setBillingModalViewState("integratingModel");
    }
  };

  const handleSelection = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (event.target.id === "modelEnvironment") {
      // We need to set default extension if "modelEnvironment" changed.
      let defaultExtension: "h5" | "pt" = "h5";
      if (event.target.value === "tensorflow") {
        defaultExtension = "h5";
      } else if (event.target.value === "pytorch") {
        defaultExtension = "pt";
      } else if (event.target.value === "keras") {
        defaultExtension = "h5";
      }

      setModelUploadSettingsState((prev) => ({
        ...prev,
        [event.target.id]: event.target.value,
        modelExtension: defaultExtension,
      }));
    } else {
      setModelUploadSettingsState((prev) => ({
        ...prev,
        [event.target.id]: event.target.value,
      }));
    }
  };

  const handleModelFileChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files) return;

    const modelFileFromInput = event.target.files[0];

    setModelUploadSettingsState((prev) => ({
      ...prev,
      modelFile: modelFileFromInput,
    }));
  };

  const handleUploadButton = async () => {
    setBillingModalViewState("uploadingModel");
    setModelUploadProgress(0);

    if (!modelUploadSettingsState.modelFile) {
      console.error("There is no file choosen.");
      return setBillingModalViewState("uploadModel");
    }

    // Uploading model to Firebase Storage, temporarily.
    let modelURL;
    try {
      const authObject = auth.currentUser;
      if (authObject === null) {
        console.error("There is no user for operation.");
        return setBillingModalViewState("uploadModel");
      }

      const storageRef = ref(
        storage,
        `/users/${authObject.displayName}/model/temp/model.${modelUploadSettingsState.modelExtension}`
      );

      const uploadTask = uploadBytesResumable(
        storageRef,
        modelUploadSettingsState.modelFile
      );

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

          setModelUploadProgress(progress);
        },
        (error) => {
          console.error("Error on uploading model file to storage: ", error);
        },
        () => {
          console.log("Upload successfull");
        }
      );

      await uploadTask;

      const modelURLFetched = await getDownloadURL(storageRef);

      modelURL = modelURLFetched;
    } catch (error) {
      console.error("Error on uploading model file temporarily: \n", error);
      return setBillingModalViewState("uploadModel");
    }

    // Update Firestore "temp" doc.
    try {
      const authObject = auth.currentUser;
      if (authObject === null) {
        console.error("There is no user for operation.");
        return setBillingModalViewState("uploadModel");
      }
      const idToken = await authObject.getIdToken();
      if (idToken === undefined) {
        console.error("IdToken is undefined.");
        return setBillingModalViewState("uploadModel");
      }

      const body: ModelSettings = {
        modelPath: modelURL,
        inputImageSizes: modelUploadSettingsState.inputImageSizes,
        modelEnvironment: modelUploadSettingsState.modelEnvironment,
        modelExtension: modelUploadSettingsState.modelExtension,
      };

      const response = await fetch("api/user/model/uploadModel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ ...body }),
      });

      if (!response.ok) {
        console.error(
          "Response from 'uploadModel' is not okay: \n",
          await response.text()
        );
        return setBillingModalViewState("uploadModel");
      }

      // Everthing alright...
      return setBillingModalViewState("initialLoading");
    } catch (error) {
      console.error("Error on fetching uploadModelAPI: \n", error);
      return setBillingModalViewState("uploadModel");
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
    setBillingModalViewState("integratingModel");

    const authObject = auth.currentUser;
    if (authObject === null) {
      console.error("There is no user for operation.");
      return setBillingModalViewState("integrateModel");
    }

    const idToken = await authObject.getIdToken();
    if (idToken === undefined) {
      console.error("IdToken is undefined.");
      return setBillingModalViewState("integrateModel");
    }

    try {
      const response = await fetch("api/user/model/integrateModel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          "Response from 'integrateModel' is not okay: \n",
          await response.text()
        );
        return setBillingModalViewState("integrateModel");
      }

      // Everthing is alright...
      setBillingModalViewState("initialLoading");
      return setBillingModalState({ isOpen: false });
    } catch (error) {
      console.error("Error on fetching integrateModelAPI: \n", error);
      return setBillingModalViewState("integrateModel");
    }
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
        if (billingModalViewState !== "uploadModel") return;
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
        {billingModalViewState === "uploadModel" ||
        billingModalViewState === "uploadingModel" ? (
          <ModalHeader color="white">Upload Model</ModalHeader>
        ) : (
          <ModalHeader color="white">Billing Panel</ModalHeader>
        )}

        <ModalCloseButton
          color="white"
          hidden={billingModalViewState !== "uploadModel"}
        />
        <ModalBody display="flex">
          {billingModalViewState === "initialLoading" && (
            <Spinner color="gray.500" width="50pt" height="50pt" />
          )}

          {billingModalViewState === "uploadModel" && (
            <Flex
              id="uploadModel-flex"
              direction="column"
              gap="10px"
              width="100%"
            >
              <Flex
                direction="column"
                gap="5"
                width="100%"
                justify="center"
                align="center"
              >
                <Flex
                  id="Model-Settings"
                  direction="column"
                  gap="5px"
                  width="100%"
                >
                  <Flex
                    id="model-environemt"
                    direction="column"
                    bg="black"
                    borderRadius="10px"
                    p="4"
                    width="100%"
                  >
                    <Text color="gray.700" fontWeight="500" fontSize="12pt">
                      Model Environment
                    </Text>
                    <Select
                      id="modelEnvironment"
                      onChange={handleSelection}
                      value={modelUploadSettingsState.modelEnvironment}
                      iconColor="white"
                      sx={{
                        backgroundColor: "black",
                        textColor: "#D69E2E",
                        fontWeight: "700",
                        fontSize: "16pt",
                        borderWidth: "0px",
                        paddingLeft: 0,
                      }}
                    >
                      <option value="tensorflow">TensorFlow</option>
                      <option value="pytorch">PyTorch</option>
                      <option value="keras">Keras</option>
                    </Select>
                  </Flex>
                  <Flex
                    id="input-imagesize"
                    direction="column"
                    bg="black"
                    borderRadius="10px"
                    p="4"
                    width="100%"
                  >
                    <Text color="gray.700" fontWeight="500" fontSize="12pt">
                      Input Image Sizes
                    </Text>
                    <Select
                      id="inputImageSizes"
                      onChange={handleSelection}
                      value={modelUploadSettingsState.inputImageSizes}
                      iconColor="white"
                      sx={{
                        backgroundColor: "black",
                        textColor: "#00B5D8",
                        fontWeight: "700",
                        fontSize: "16pt",
                        borderWidth: "0px",
                        paddingLeft: 0,
                      }}
                    >
                      <option value="64x64">64 x 64</option>
                      <option value="120x120">120 x 120</option>
                      <option value="224x224">224 x 224</option>
                      <option value="299x299">299 x 299</option>
                      <option value="331x331">331 x 331</option>
                      <option value="512x512">512 x 512</option>
                    </Select>
                  </Flex>
                  <Flex
                    id="model-extension"
                    direction="column"
                    bg="black"
                    borderRadius="10px"
                    p="4"
                    width="100%"
                  >
                    <Text color="gray.700" fontWeight="500" fontSize="12pt">
                      Model Extension
                    </Text>
                    <Select
                      id="modelExtension"
                      onChange={handleSelection}
                      value={modelUploadSettingsState.modelExtension}
                      iconColor="white"
                      sx={{
                        backgroundColor: "black",
                        textColor: "#805AD5",
                        fontWeight: "700",
                        fontSize: "16pt",
                        borderWidth: "0px",
                        paddingLeft: 0,
                      }}
                    >
                      {modelUploadSettingsState.modelEnvironment ===
                        "tensorflow" && (
                        <>
                          <option value="h5">.h5</option>
                          <option value="tflite">.tflite</option>
                        </>
                      )}
                      {modelUploadSettingsState.modelEnvironment ===
                        "keras" && <option value="h5">.h5</option>}
                      {modelUploadSettingsState.modelEnvironment ===
                        "pytorch" && (
                        <>
                          <option value="pt">.pt</option>
                          <option value="pth">.pth</option>
                        </>
                      )}
                    </Select>
                  </Flex>
                  <Flex
                    id="model-environemt"
                    direction="column"
                    bg="black"
                    borderRadius="10px"
                    p="4"
                    width="100%"
                  >
                    <Flex align="center" gap="2">
                      <Text color="gray.700" fontWeight="500" fontSize="12pt">
                        Model File
                      </Text>
                      <Button
                        variant="outline"
                        colorScheme="blue"
                        size="xs"
                        onClick={() => {
                          if (modelInputRef.current)
                            modelInputRef.current.click();
                        }}
                      >
                        Choose New Model
                      </Button>
                    </Flex>

                    <Text
                      color="pink.500"
                      fontWeight="700"
                      fontSize="16pt"
                      maxWidth="15em"
                      isTruncated
                    >
                      {modelUploadSettingsState.modelFile
                        ? modelUploadSettingsState.modelFile.name
                        : "Choose a file."}
                    </Text>

                    <Input
                      ref={modelInputRef}
                      onChange={handleModelFileChange}
                      type="file"
                      accept={`.${modelUploadSettingsState.modelExtension}`}
                      hidden
                    />
                  </Flex>
                </Flex>
                <Flex justify="center" align="center" gap="2">
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    size="md"
                    onClick={handleUploadButton}
                    isDisabled={!modelUploadSettingsState.modelFile}
                  >
                    Upload
                  </Button>
                </Flex>
              </Flex>
            </Flex>
          )}

          {billingModalViewState === "uploadingModel" && (
            <Flex
              width="100%"
              id="uploading-model-flex"
              direction="column"
              gap="20px"
              align="center"
              justify="center"
            >
              <CircularProgress
                isIndeterminate={
                  modelUploadProgress === 0 || modelUploadProgress === 100
                }
                color="teal"
                size="55pt"
                value={modelUploadProgress}
                alignContent="center"
                justifyContent="center"
              />
              <Text color="white" fontSize="15pt" fontWeight="700">
                Uploading Model
              </Text>
            </Flex>
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
                    Plesae provide a &ldquo;payer&ldquo; address. Note that, you
                    can only make payment with the address you will provide.
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

          {billingModalViewState === "integrateModel" && (
            <Flex
              id="paymentVerified-integrateModel-flex"
              direction="column"
              gap="10px"
            >
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

          {billingModalViewState == "integratingModel" && (
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
