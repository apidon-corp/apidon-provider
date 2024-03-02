import { atom } from "recoil";

type billingModalStatusType = {
  isOpen: boolean;
};

export const billingModalStatusAtom = atom<billingModalStatusType>({
  default: { isOpen: false },
  key: "billing_modal_status_atom",
});
