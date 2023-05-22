import { atom } from "recoil";

interface IAuthenticationModalsStatusAtom {
  currentPanelName: "signup" | "login";
  open: boolean;
}

export const authenticationModalsStatusAtom =
  atom<IAuthenticationModalsStatusAtom>({
    default: { currentPanelName: "login", open: false },
    key: "authenticationModalsStatusAtomKey",
  });
