import { CurrentUser } from "@/types/User";
import { atom } from "recoil";

export const currentUserStateAtom = atom<CurrentUser>({
  default: {
    name: "",
    description: "",
    email: "",
    image: "",
    price: -1,
    currency: "",
    uid: "",
    isThereCurrentUser: false,
  },
  key: "currentProviderAtomKey",
});
