import { CurrentUser, DefaultCurrentUser } from "@/types/User";
import { atom } from "recoil";

export const currentUserStateAtom = atom<CurrentUser>({
  default: DefaultCurrentUser,
  key: "currentUserStateAtomKey",
});
