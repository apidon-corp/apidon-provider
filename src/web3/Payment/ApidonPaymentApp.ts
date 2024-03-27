import { ethers } from "ethers";

import paymentContract from "./ApidonPayment.json";

const apidonPaymentContractMumbaiAddress =
  "0x99aD82d752a585C1eC310FEA3c171d1Fb3e1Ca1F";

const contractInteractionAPIKey = process.env
  .ALCHEMY_MUBMAI_NETOWRK_APIDON_PAYMENT_CONTRACT_API as string;

const provider = new ethers.AlchemyProvider(
  "maticmum",
  contractInteractionAPIKey
);

const walletPrivateKey = process.env.METAMASK_ACCOUNT_TWO_PRIVATE_KEY as string;

const wallet = new ethers.Wallet(walletPrivateKey, provider);

const apidonPaymentContract = new ethers.Contract(
  apidonPaymentContractMumbaiAddress,
  paymentContract.abi,
  wallet
);

export { apidonPaymentContract };
