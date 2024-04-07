import { ethers } from "ethers";

import paymentContract from "./ApidonPayment.json";

const apidonPaymentContractSepoliaAddress = process.env
  .APIDON_PAYMENT_CONTRACT_SEPOLIA_ADDRESS as string;

const providerAccessURL = process.env.ALCHEMY_SEPOLIA_NETWORK_URL as string;

const provider = new ethers.JsonRpcProvider(providerAccessURL);

const walletPrivateKey = process.env
  .WEB3_PROVIDER_MAIN_WALLET_PRIVATE_ADDRESS as string;

const wallet = new ethers.Wallet(walletPrivateKey, provider);

const apidonPaymentContract = new ethers.Contract(
  apidonPaymentContractSepoliaAddress,
  paymentContract.abi,
  wallet
);

export { apidonPaymentContract };
