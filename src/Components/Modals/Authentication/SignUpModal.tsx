import { authenticationModalsStatusAtom } from "@/atoms/authenticationModalsStatusAtom";
import { appCheck } from "@/firebase/clientApp";
import useLogin from "@/hooks/authHooks/useLogin";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Image,
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
import { getToken } from "firebase/app-check";
import React, {
  ChangeEvent,
  createRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { BiError, BiErrorCircle } from "react-icons/bi";
import { useRecoilState } from "recoil";

export default function SignUpModal() {
  const [modalViewState, setModalViewState] = useState<
    | "referralCode"
    | "verifyingReferralCode"
    | "epu"
    | "sendingEmailVerificationCode"
    | "enterEmailVerificationCode"
    | "verifyingEup"
  >("referralCode");

  const referralCodeInputRef = useRef<HTMLInputElement>(null);
  const [referralCode, setReferralCode] = useState("");
  const [referralCodeError, setReferralCodeError] = useState("");

  const emailInputRef = useRef<HTMLInputElement>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const passwordInputref = useRef<HTMLInputElement>(null);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState({
    digit: false,
    lowercase: false,
    uppercase: false,
    eightCharacter: false,
    special: false,
  });

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const templateArray = [0, 0, 0, 0, 0, 0];

  const [verificationCodeInputRefs, setVerificationCodeInputRefs] = useState<
    Array<React.RefObject<HTMLInputElement>>
  >([]);

  const [verificationCode, setVerificationCode] = useState(
    new Array(6).fill("")
  );
  const [verificationCodeError, setVerificationCodeError] = useState("");
  const [authModalState, setAuthModalState] = useRecoilState(
    authenticationModalsStatusAtom
  );

  const { logSignedOutUserIn } = useLogin();

  const handleReferralCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReferralCodeError("");
    const input = event.target.value;
    setReferralCode(input);
  };

  const handleContinueOnReferralScreen = async () => {
    setModalViewState("verifyingReferralCode");

    try {
      const appCheckTokenResult = await getToken(appCheck);
      const token = appCheckTokenResult.token;

      const response = await fetch(
        "/api/user/authentication/signup/checkReferralCode",
        {
          method: "POST",
          headers: {
            authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referralCode: referralCode,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        setReferralCodeError(errorMessage);
        setModalViewState("referralCode");
        setTimeout(() => {
          if (referralCodeInputRef.current)
            referralCodeInputRef.current.focus();
        }, 0);
        return;
      }

      // Opening epuf screen
      setModalViewState("epu");
      setTimeout(() => {
        if (emailInputRef.current) emailInputRef.current.focus();
      }, 0);
      return;
    } catch (error) {
      setReferralCodeError("Internal server error");
      setModalViewState("referralCode");
      setTimeout(() => {
        if (referralCodeInputRef.current) referralCodeInputRef.current.focus();
      }, 0);
      return;
    }
  };

  const handleEmailChange = async (event: ChangeEvent<HTMLInputElement>) => {
    // Clear Error Message
    setEmailError("");

    const input = event.target.value;
    setEmail(input);

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
    const regexTestResult = emailRegex.test(input);

    setIsEmailValid(regexTestResult);
  };

  const handlePasswordChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setPassword(input);

    const passwordRegex =
      /^(?=.*?\p{Lu})(?=.*?\p{Ll})(?=.*?\d)(?=.*?[^\w\s]|[_]).{12,}$/u;

    const regexTestResult = passwordRegex.test(input);

    setIsPasswordValid(regexTestResult);

    // Explain Error
    setPasswordStatus({
      digit: /^(?=.*?\d)/u.test(input),
      lowercase: /^(?=.*?\p{Ll})/u.test(input),
      uppercase: /^(?=.*?\p{Lu})/u.test(input),
      eightCharacter: /^.{12,}$/u.test(input),
      special: /^(?=.*?[^\w\s]|[_])/u.test(input),
    });
  };

  const handleUsernameChange = async (event: ChangeEvent<HTMLInputElement>) => {
    // Clear Error Message
    setUsernameError("");

    let input = event.target.value;
    // Lowercasing Help
    if (input.toLowerCase() !== input) {
      input = input.toLowerCase();
    }

    // Non-Spacing Help
    input = input.trimEnd();

    // Non-Special Help
    input = input.replace(/[^\w\s]$/, "");

    setUsername(input);

    const usernameRegex = /^[a-z0-9]{4,20}$/;
    const regexTestResult = usernameRegex.test(input);

    setIsUsernameValid(regexTestResult);

    // Explain Error
    if (!regexTestResult)
      setUsernameError(
        "Please enter a username consisting of 4 to 20 characters, using only lowercase letters (a-z) and digits (0-9)."
      );
  };

  const handleSignUpButton = async () => {
    // Clearing the errors we there is
    setEmailError("");
    setPasswordStatus({
      digit: true,
      eightCharacter: true,
      lowercase: true,
      special: true,
      uppercase: true,
    });
    setUsernameError("");

    setVerificationCodeError("");

    // Quick Regex Check
    const regexTestResult = quickRegexCheck();
    if (!regexTestResult) {
      console.log("Regex test result is not okay.");
      setModalViewState("epu");
      return;
    }

    setModalViewState("sendingEmailVerificationCode");

    // Verification Code Sending
    try {
      const appCheckTokenResult = await getToken(appCheck);
      const token = appCheckTokenResult.token;

      const response = await fetch(
        "/api/user/authentication/signup/verificationCodeSend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
          body: JSON.stringify({
            referralCode: referralCode,
            email: email,
            password: password,
            username: username,
          }),
        }
      );

      if (!response.ok) {
        const result = (await response.json()) as {
          cause: string;
          message: string;
        };

        console.log("Result from 'verificationCodeSend': ", result);

        if (result.cause === "auth") {
          setModalViewState("epu");
          // Because username error is at the bottom, I am changing it.
          setUsernameError(
            "Authentication cannot be established. Try again later."
          );
          return;
        }

        if (result.cause === "server") {
          setModalViewState("epu");
          return;
        }

        if (result.cause === "email") {
          // We need to open epuf screen.
          setModalViewState("epu");

          // We need to set error
          setIsEmailValid(false);
          setEmailError(result.message);

          return;
        }

        if (result.cause === "password") {
          // We need to open epuf screen.
          setModalViewState("epu");

          // We need to set error
          setIsPasswordValid(false);
          setPasswordStatus((prev) => ({ ...prev }));
          return;
        }

        if (result.cause === "username") {
          // We need to open epuf screen.
          setModalViewState("epu");

          // We need to set error
          setIsUsernameValid(false);
          setUsernameError(result.message);
          return;
        }

        if (result.cause === "referralCode") {
          // We need to open epuf screen.
          setModalViewState("referralCode");

          // We need to set error
          setReferralCodeError(result.message);
          return;
        }

        // Just in case, we couldn't catch error codes.
        console.error("Invalid response came from 'sendVerificationEmail' API");
        return setModalViewState("epu");
      }

      // Everthing is alright.

      return setModalViewState("enterEmailVerificationCode");
    } catch (error) {
      console.error("Error on sending email verification code: \n", error);
      return setModalViewState("epu");
    }
  };

  const quickRegexCheck = () => {
    // Email
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|aol|icloud|protonmail|yandex|mail|zoho)\.(com|net|org)$/i;
    const regexTestResultE = emailRegex.test(email);
    setIsEmailValid(regexTestResultE);
    if (!regexTestResultE) return false;

    // Password
    const passwordRegex =
      /^(?=.*?\p{Lu})(?=.*?\p{Ll})(?=.*?\d)(?=.*?[^\w\s]|[_]).{12,}$/u;
    const regexTestResultP = passwordRegex.test(password);
    setIsPasswordValid(regexTestResultP);
    setPasswordStatus({
      digit: /^(?=.*?\d)/u.test(password),
      lowercase: /^(?=.*?\p{Ll})/u.test(password),
      uppercase: /^(?=.*?\p{Lu})/u.test(password),
      eightCharacter: /^.{12,}$/u.test(password),
      special: /^(?=.*?[^\w\s]|[_])/u.test(password),
    });
    if (!regexTestResultP) return false;

    // Username
    const usernameRegex = /^[a-z0-9]{4,20}$/;
    const regexTestResultU = usernameRegex.test(username);
    setIsUsernameValid(regexTestResultU);
    if (!regexTestResultU)
      setUsernameError(
        "Please enter a username consisting of 4 to 20 characters, using only lowercase letters (a-z) and digits (0-9)."
      );
    if (!regexTestResultU) return false;

    return true;
  };

  const handleVerificationCodeChange = (
    event: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const input = event.target.value;

    setVerificationCodeError("");

    if (input !== "") {
      const verificationCodeRegex = /^[0-9]$/;
      const regexTestResult = verificationCodeRegex.test(input);
      if (!regexTestResult) {
        return;
      }
    }

    const newCode = [...verificationCode];
    newCode[index] = input;

    setVerificationCode(newCode);

    // Focusing to the next.
    if (input !== "" && index < templateArray.length - 1) {
      setTimeout(() => {
        if (
          verificationCodeInputRefs[index + 1] &&
          verificationCodeInputRefs[index + 1].current
        ) {
          verificationCodeInputRefs[index + 1].current?.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && index > 0 && verificationCode[index] === "") {
      setTimeout(() => {
        if (
          verificationCodeInputRefs[index - 1] &&
          verificationCodeInputRefs[index - 1].current
        )
          verificationCodeInputRefs[index - 1].current?.focus();
      }, 0);
    }
  };

  const handleVerifyButton = async () => {
    setModalViewState("verifyingEup");

    // Clearing the errors we there is
    setEmailError("");
    setPasswordStatus({
      digit: true,
      eightCharacter: true,
      lowercase: true,
      special: true,
      uppercase: true,
    });
    setUsernameError("");
    setVerificationCodeError("");

    // Quick Regex Check
    const regexTestResult = quickRegexCheck();
    if (!regexTestResult) {
      setModalViewState("epu");
      return;
    }

    const verificationCodeRegex = /^\d{6}$/;
    const regexTestResultV = verificationCodeRegex.test(
      verificationCode.join("")
    );
    if (!regexTestResultV) {
      setVerificationCodeError("Verification code is invalid");
      setModalViewState("enterEmailVerificationCode");
      return;
    }

    try {
      const appCheckTokenResult = await getToken(appCheck);
      const token = appCheckTokenResult.token;

      const response = await fetch("/api/user/authentication/signup/signup", {
        method: "POST",
        headers: {
          authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode: referralCode,
          email: email,
          password: password,
          username: username,
          verificationCode: verificationCode.join(""),
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as {
          cause: string;
          message: string;
        };

        console.log("Result from 'responseNotOkay': ", result);

        if (result.cause === "auth") {
          setModalViewState("epu");
          // Because username error is at the bottom, I am changing it.
          setUsernameError(
            "Authentication cannot be established. Try again later."
          );
          return;
        }

        if (result.cause === "server") {
          setModalViewState("epu");
          return;
        }

        if (result.cause === "email") {
          // We need to open epuf screen.
          setModalViewState("epu");

          // We need to set error
          setIsEmailValid(false);
          setEmailError(result.message);

          return;
        }

        if (result.cause === "password") {
          // We need to open epuf screen.
          setModalViewState("epu");

          // We need to set error
          setIsPasswordValid(false);
          setPasswordStatus((prev) => ({ ...prev }));
          return;
        }

        if (result.cause === "username") {
          // We need to open epuf screen.
          setModalViewState("epu");

          // We need to set error
          setIsUsernameValid(false);
          setUsernameError(result.message);
          return;
        }

        if (result.cause === "referralCode") {
          // We need to open epuf screen.
          setModalViewState("referralCode");

          // We need to set error
          setReferralCodeError(result.message);
          return;
        }

        if (result.cause === "verificationCode") {
          // We need to open epuf screen.
          setModalViewState("enterEmailVerificationCode");

          // We need to set error
          setVerificationCodeError(result.message);
          return;
        }

        // Just in case, we couldn't catch error codes.
        return;
      }

      // We need to log user in with these new credentals.
      const loginResult = await logSignedOutUserIn(email, password);

      if (!loginResult) {
        setAuthModalState((prev) => ({ ...prev, open: true, view: "login" }));
        return;
      }

      // We need to close auth modal.
    } catch (error) {
      console.error("Error on fetching signup api: \n", error);

      // Error come from fetch operation.
      setModalViewState("epu");

      // Because fullname error is at the bottom, I am changing it to show "unexpected error" error to users.
      setUsernameError("Internal server error. Try again later.");
      return;
    }
  };

  /**
   * To Create input elements.
   */
  useEffect(() => {
    setVerificationCodeInputRefs((ref) =>
      Array(templateArray.length)
        .fill("0")
        .map((_, i) => verificationCodeInputRefs[i] || createRef())
    );
  }, [templateArray.length]);

  return (
    <Modal
      id="signup-modal"
      isOpen={authModalState.open && authModalState.view === "signup"}
      onClose={() => {
        if (
          !(
            modalViewState === "verifyingReferralCode" ||
            modalViewState === "sendingEmailVerificationCode" ||
            modalViewState === "verifyingEup"
          )
        )
          setAuthModalState((prev) => ({
            ...prev,
            open: false,
            view: "signup",
          }));
      }}
      size={{
        base: "full",
        sm: "full",
        md: "lg",
        lg: "lg",
      }}
      scrollBehavior="inside"
      allowPinchZoom={true}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="10px" />
      <ModalContent
        bg="black"
        minHeight={{
          md: "500px",
          lg: "500px",
        }}
      >
        <ModalHeader color="white">Sign Up</ModalHeader>

        {!(
          modalViewState === "verifyingReferralCode" ||
          modalViewState === "verifyingEup"
        ) && <ModalCloseButton color="white" />}

        <ModalBody display="flex">
          {modalViewState === "referralCode" && (
            <Flex
              id="referralCode-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="20px"
            >
              <Image src="/og.png" width="20%" />
              <Flex
                id="login-desc"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Text color="white" fontWeight="600" fontSize="20pt">
                  Join Apidon
                </Text>
                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  To continue, please enter your referral code. You&apos;ll be
                  prompted for your email and password on the next screen.
                </Text>
              </Flex>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleContinueOnReferralScreen();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <Flex
                  id="login-input-and-error"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                >
                  <InputGroup>
                    <FormControl variant="floating">
                      <Input
                        ref={referralCodeInputRef}
                        required
                        name="referral-code"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handleReferralCodeChange}
                        value={referralCode}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        fontSize="16px"
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Referral Code
                      </FormLabel>
                    </FormControl>
                    <InputRightElement>
                      {referralCodeError && (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      )}
                    </InputRightElement>
                  </InputGroup>
                  <Flex id="referral-code-error-message">
                    <Text
                      color="red"
                      fontSize="10pt"
                      fontWeight="400"
                      textAlign="center"
                    >
                      {referralCodeError}
                    </Text>
                  </Flex>
                </Flex>

                <Flex id="referral-contuniue-button" justify="center">
                  <Button
                    bg="white"
                    color="black"
                    border="1px solid white"
                    _hover={{
                      bg: "black",
                      color: "white",
                      border: "1px solid white",
                    }}
                    _focus={{
                      bg: "#343434",
                      color: "white",
                      border: "1px solid #343434",
                    }}
                    isDisabled={referralCodeError.length > 0}
                    type="submit"
                  >
                    Continue
                  </Button>
                </Flex>
              </form>
              <Flex
                id="have-account-text-flex"
                width="100%"
                align="center"
                justify="center"
              >
                <Text
                  color="blue.500"
                  fontSize="10pt"
                  as="b"
                  textDecor="underline"
                  cursor="pointer"
                  onClick={() => {
                    setAuthModalState({ open: true, view: "login" });
                  }}
                >
                  Have an account? Log In!
                </Text>
              </Flex>
            </Flex>
          )}
          {modalViewState === "verifyingReferralCode" && (
            <Flex
              id="referralCodeVerify-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "epu" && (
            <Flex
              id="email-password-username-fullname-flex"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="20px"
            >
              <Image src="/og.png" width="20%" />
              <Flex
                id="epuf-desc"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Text color="white" fontWeight="600" fontSize="20pt">
                  Join Apidon
                </Text>
                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  To finish sign up, please enter your email, password,
                  username.
                </Text>
              </Flex>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSignUpButton();
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <Flex
                  id="email-part"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                >
                  <InputGroup id="email">
                    <FormControl variant="floating">
                      <Input
                        isInvalid={email.length !== 0 && !isEmailValid}
                        type="email"
                        ref={emailInputRef}
                        required
                        name="email-signup"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handleEmailChange}
                        value={email}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        fontSize="16px"
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Email
                      </FormLabel>
                    </FormControl>
                    <InputRightElement>
                      {!isEmailValid && email.length !== 0 && (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      )}
                    </InputRightElement>
                  </InputGroup>

                  <Flex id="email-error">
                    <Text
                      color="red"
                      fontSize="10pt"
                      fontWeight="400"
                      textAlign="center"
                    >
                      {emailError}
                    </Text>
                  </Flex>
                </Flex>
                <Flex
                  id="password-part"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                >
                  <InputGroup id="password">
                    <FormControl variant="floating">
                      <Input
                        isInvalid={password.length !== 0 && !isPasswordValid}
                        type="password"
                        ref={passwordInputref}
                        required
                        name="password-signup"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handlePasswordChange}
                        value={password}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        fontSize="16px"
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Password
                      </FormLabel>
                    </FormControl>
                    <InputRightElement>
                      {!isPasswordValid && password.length !== 0 && (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      )}
                    </InputRightElement>
                  </InputGroup>

                  <Flex
                    width="100%"
                    id="password-error"
                    direction="column"
                    hidden={isPasswordValid || password.length === 0}
                  >
                    <Flex
                      id="digit"
                      gap={1}
                      hidden={passwordStatus.digit}
                      align="center"
                    >
                      <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
                      <Text fontSize="10pt" color={"red"} as="b">
                        Numbers (0-9)
                      </Text>
                    </Flex>
                    <Flex
                      id="lowercase"
                      gap={1}
                      hidden={passwordStatus.lowercase}
                      align="center"
                    >
                      <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
                      <Text fontSize="10pt" color={"red"} as="b">
                        Lower case letters (aa)
                      </Text>
                    </Flex>
                    <Flex
                      id="uppercase"
                      gap={1}
                      hidden={passwordStatus.uppercase}
                      align="center"
                    >
                      <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
                      <Text fontSize="10pt" color={"red"} as="b">
                        Upper case letters (AA)
                      </Text>
                    </Flex>
                    <Flex
                      id="special"
                      gap={1}
                      hidden={passwordStatus.special}
                      align="center"
                    >
                      <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
                      <Text fontSize="10pt" color={"red"} as="b">
                        Special characters (&*%)
                      </Text>
                    </Flex>
                    <Flex
                      id="eightCharacter"
                      gap={1}
                      hidden={passwordStatus.eightCharacter}
                      align="center"
                    >
                      <Icon fontSize="17px" color={"red"} as={BiErrorCircle} />
                      <Text fontSize="10pt" color={"red"} as="b">
                        At least 12 characters
                      </Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Flex
                  id="username-part"
                  direction="column"
                  width="100%"
                  align="center"
                  justify="center"
                >
                  <InputGroup id="username">
                    <FormControl variant="floating">
                      <Input
                        isInvalid={username.length !== 0 && !isUsernameValid}
                        type="text"
                        ref={usernameInputRef}
                        required
                        name="username-signup"
                        placeholder=" "
                        mb={2}
                        pr={"9"}
                        onChange={handleUsernameChange}
                        value={username}
                        _hover={{
                          border: "1px solid",
                          borderColor: "blue.500",
                        }}
                        textColor="white"
                        bg="black"
                        spellCheck={false}
                        isRequired
                        fontSize="16px"
                      />
                      <FormLabel
                        bg="rgba(0,0,0)"
                        textColor="gray.500"
                        fontSize="12pt"
                        my={2}
                      >
                        Username
                      </FormLabel>
                    </FormControl>
                    <InputRightElement>
                      {!isUsernameValid && username.length !== 0 && (
                        <Icon as={BiError} fontSize="20px" color="red" />
                      )}
                    </InputRightElement>
                  </InputGroup>

                  <Flex id="username-error">
                    <Text color="red" fontSize="10pt" as="b" textAlign="center">
                      {usernameError}
                    </Text>
                  </Flex>
                </Flex>
                <Flex id="signup-button" justify="center">
                  <Button
                    bg="white"
                    color="black"
                    border="1px solid white"
                    _hover={{
                      bg: "black",
                      color: "white",
                      border: "1px solid white",
                    }}
                    _focus={{
                      bg: "#343434",
                      color: "white",
                      border: "1px solid #343434",
                    }}
                    isDisabled={
                      !isEmailValid || !isPasswordValid || !isUsernameValid
                    }
                    type="submit"
                  >
                    Sign Up
                  </Button>
                </Flex>
              </form>
              <Flex
                id="have-account-text-flex"
                width="100%"
                align="center"
                justify="center"
              >
                <Text
                  color="blue.500"
                  fontSize="10pt"
                  as="b"
                  textDecor="underline"
                  cursor="pointer"
                  onClick={() => {
                    setAuthModalState({ open: true, view: "login" });
                  }}
                >
                  Have an account? Log In!
                </Text>
              </Flex>
            </Flex>
          )}
          {modalViewState === "sendingEmailVerificationCode" && (
            <Flex
              id="sendingEmailVerificationCode-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
          {modalViewState === "enterEmailVerificationCode" && (
            <Flex
              id="enterEmailVerificationCode"
              width="100%"
              align="center"
              justify="center"
              direction="column"
              gap="20px"
            >
              <Image src="/og.png" width="20%" />
              <Flex
                id="verification-code-desc"
                direction="column"
                align="center"
                justify="center"
                gap="5px"
              >
                <Text color="white" fontWeight="600" fontSize="20pt">
                  Verify Your Account
                </Text>
                <Text
                  color="gray.500"
                  fontWeight="600"
                  fontSize="10pt"
                  textAlign="center"
                >
                  To continue, please enter your verification code. We&apos;ve
                  sent it to{" "}
                  <span
                    style={{
                      color: "#3182CE",
                      fontSize: "10pt",
                      textAlign: "center",
                    }}
                  >
                    {email}
                  </span>
                </Text>
              </Flex>

              <Flex
                id="verification-code-input-error"
                direction="column"
                width="100%"
                align="center"
                justify="center"
                gap="20px"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyButton();
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                  }}
                >
                  <Flex
                    id="digit-inputs"
                    width="100%"
                    align="center"
                    justify="space-between"
                  >
                    {templateArray.map((_, i) => (
                      <Input
                        key={i}
                        ref={verificationCodeInputRefs[i]}
                        color="white"
                        width="50px"
                        height="50px"
                        rounded="full"
                        textAlign="center"
                        fontSize="25px"
                        fontWeight="700"
                        value={verificationCode[i]}
                        onChange={(e) => {
                          handleVerificationCodeChange(e, i);
                        }}
                        onKeyDown={(e) => {
                          handleKeyDown(e, i);
                        }}
                      />
                    ))}
                  </Flex>

                  <Flex id="verification-code-error-message" justify="center">
                    <Text
                      color="red"
                      fontSize="10pt"
                      fontWeight="400"
                      textAlign="center"
                    >
                      {verificationCodeError}
                    </Text>
                  </Flex>
                  <Flex id="verify-button" justify="center">
                    <Button
                      bg="white"
                      color="black"
                      border="1px solid white"
                      _hover={{
                        bg: "black",
                        color: "white",
                        border: "1px solid white",
                      }}
                      _focus={{
                        bg: "#343434",
                        color: "white",
                        border: "1px solid #343434",
                      }}
                      isDisabled={!/^\d{6}$/.test(verificationCode.join(""))}
                      type="submit"
                    >
                      Verify
                    </Button>
                  </Flex>
                </form>
              </Flex>
            </Flex>
          )}
          {modalViewState === "verifyingEup" && (
            <Flex
              id="verifyingEup-flex"
              width="100%"
              align="center"
              justify="center"
            >
              <Spinner width="75px" height="75px" color="white" />
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
