import { atom } from "recoil";

interface IAuthenticationModalsStatusAtom {
  view: "signup" | "login" | "resetPassword"
  open: boolean;
}

export const authenticationModalsStatusAtom =
  atom<IAuthenticationModalsStatusAtom>({
    default: { view: "login", open: false },
    key: "authenticationModalsStatusAtomKey",
  });
