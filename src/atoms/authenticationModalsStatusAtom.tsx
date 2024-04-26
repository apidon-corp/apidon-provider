import { atom } from "recoil";

interface IAuthenticationModalsStatusAtom {
  view: "signup" | "login";
  open: boolean;
}

export const authenticationModalsStatusAtom =
  atom<IAuthenticationModalsStatusAtom>({
    default: { view: "login", open: false },
    key: "authenticationModalsStatusAtomKey",
  });
