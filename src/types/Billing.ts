export type PaymentRuleInServer = {
  active: boolean;
  price: number;
  due: number;
  id: string;
  occured: boolean;
  payer: string;
  integrationStarted: boolean;
};

export type CheckPaymentRuleAPIRequestBody = {
  providerId: string;
};

export type CheckPaymentRuleAPIResponse = {
  activePaymentRuleData?: {
    price: number;
    due: number;
    id: string;
    occured: boolean;
    payer: string;
    integrationStarted: boolean;
  };
  thereIsNoActivePaymentRule: boolean;
};

export type CalculateBillAPIReponse = {
  postCount: number;
  pricePerPost: number;
  totalPrice: number;
  currency: "dollar" | "matic" | "turkish_lira";
};

export type CreatePaymentRuleAPIRequestBody = {
  payerAddress: string;
};

export type CreatePaymentRuleAPIResponse = {
  active: boolean;
  price: number;
  due: number;
  id: string;
  occured: boolean;
  payer: string;
  integrationStarted: boolean;
};
