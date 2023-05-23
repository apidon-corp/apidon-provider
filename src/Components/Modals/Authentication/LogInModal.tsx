import { authenticationModalsStatusAtom } from "@/atoms/authenticationModalsStatusAtom";
import useLogin from "@/hooks/authHooks/useLogin";
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

type Props = {};

export default function LogInModal({}: Props) {
  const [authenticationModalsStatusState, setAuthenticationModalsStatusState] =
    useRecoilState(authenticationModalsStatusAtom);

  const [loginModalOpenState, setLoginModalOpenState] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const { logSignedOutUserIn } = useLogin();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tempLoginModalOpenState =
      authenticationModalsStatusState.open &&
      authenticationModalsStatusState.currentPanelName === "login";

    setLoginModalOpenState(tempLoginModalOpenState);
  }, [authenticationModalsStatusState]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    const operationResult = await logSignedOutUserIn(
      loginForm.email,
      loginForm.password
    );

    if (operationResult)
      setAuthenticationModalsStatusState((prev) => ({ ...prev, open: false }));

    setLoading(false);
  };

  const onEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({ ...prev, email: event.target.value }));
  };
  const onPasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({ ...prev, password: event.target.value }));
  };

  return (
    <Modal
      id="login-modal"
      size={{
        base: "full",
        sm: "full",
        md: "md",
        lg: "md",
      }}
      isOpen={loginModalOpenState}
      onClose={() => {
        setAuthenticationModalsStatusState((prev) => ({
          ...prev,
          open: false,
        }));
      }}
      autoFocus={false}
    >
      <ModalOverlay backdropFilter="auto" backdropBlur="5px" />
      <ModalContent>
        <ModalHeader>Log In</ModalHeader>
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
                    onChange={onPasswordChange}
                    required
                    type="password"
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
              <Button
                variant="solid"
                colorScheme="blue"
                width="100%"
                mt="2"
                isLoading={loading}
                type="submit"
              >
                Log In
              </Button>
            </Flex>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
