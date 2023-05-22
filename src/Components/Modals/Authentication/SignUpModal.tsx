import { authenticationModalsStatusAtom } from "@/atoms/authenticationModalsStatusAtom";
import useSignUp from "@/hooks/useSignUp";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";

import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";

export default function SignUpModal() {
  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    providerName: "",
  });

  const [loading, setLoading] = useState(false);

  const { initiateSignUp } = useSignUp();

  const [authenticationModalsStatusState, setAuthenticationModalsStatusState] =
    useRecoilState(authenticationModalsStatusAtom);

  const [signUpModalOpenStatus, setSignUpModalOpenStatus] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    const operationResult = await initiateSignUp(signUpForm);

    if (operationResult)
      setAuthenticationModalsStatusState((prev) => ({ ...prev, open: false }));

    setLoading(false);
  };

  const onEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpForm((prev) => ({
      ...prev,
      email: event.target.value,
    }));
  };

  const onProviderNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpForm((prev) => ({
      ...prev,
      providerName: event.target.value,
    }));
  };

  const onPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSignUpForm((prev) => ({
      ...prev,
      password: event.target.value,
    }));
  };

  useEffect(() => {
    const tempSignUpModalStatus =
      authenticationModalsStatusState.currentPanelName === "signup" &&
      authenticationModalsStatusState.open;
    setSignUpModalOpenStatus(tempSignUpModalStatus);
  }, [authenticationModalsStatusState]);

  return (
    <Modal
      id="signup-modal"
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      onClose={() => {
        setAuthenticationModalsStatusState((prev) => ({
          ...prev,
          open: false,
        }));
      }}
      autoFocus={false}
      isOpen={signUpModalOpenStatus}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="5px" />
      <ModalContent>
        <ModalHeader>Sign Up</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={onSubmit}>
            <Flex gap="1" direction="column">
              <InputGroup>
                <FormControl variant="floating">
                  <Input
                    placeholder=" "
                    onChange={onEmailChange}
                    required
                    type="email"
                  />
                  <FormLabel
                    bg="rgba(248,250,252,1)"
                    textColor="gray.500"
                    fontSize="10pt"
                    my="2.5"
                  >
                    Email
                  </FormLabel>
                </FormControl>
              </InputGroup>
              <InputGroup>
                <FormControl variant="floating">
                  <Input
                    placeholder=" "
                    onChange={onProviderNameChange}
                    required
                  />
                  <FormLabel
                    bg="rgba(248,250,252,1)"
                    textColor="gray.500"
                    fontSize="10pt"
                    my="2.5"
                  >
                    Provider Name
                  </FormLabel>
                </FormControl>
              </InputGroup>
              <InputGroup>
                <FormControl variant="floating">
                  <Input
                    placeholder=" "
                    onChange={onPasswordChange}
                    type="password"
                    required
                  />
                  <FormLabel
                    bg="rgba(248,250,252,1)"
                    textColor="gray.500"
                    fontSize="10pt"
                    my="2.5"
                  >
                    Password
                  </FormLabel>
                </FormControl>
              </InputGroup>
            </Flex>
            <Button
              variant="solid"
              type="submit"
              colorScheme="blue"
              mt="2"
              width="100%"
              isLoading={loading}
            >
              Sign Up
            </Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
