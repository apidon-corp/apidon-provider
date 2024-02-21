import useLogin from "./useLogin";

export default function useSignUp() {
  const { logSignedOutUserIn } = useLogin();

  const initiateSignUp = async (signUpForm: {
    email: string;
    password: string;
    providerName: string;
  }) => {
    const handleSignUpResult = await handleSignUp(signUpForm);

    if (!handleSignUpResult) return false;

    const operationResult = await logSignedOutUserIn(
      signUpForm.email,
      signUpForm.password
    );

    if (!operationResult) return false;
    return true;
  };

  const handleSignUp = async (signUpForm: {
    email: string;
    password: string;
    providerName: string;
  }) => {
    let response;
    try {
      response = await fetch("/api/user/signUp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signUpForm),
      });
    } catch (error) {
      console.error("Error while fetching signUp API", error);
      return false;
    }

    if (!response.ok) {
      console.error("Error from signUp API", await response.text());
      return false;
    }

    const { createdProviderInformation } = await response.json();

    return true;
  };

  return {
    initiateSignUp,
  };
}
