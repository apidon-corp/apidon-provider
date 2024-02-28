export type PaymentRuleInServer = {
  active: boolean;
  amount: number;
  due: number;
  id: string;
  occured: boolean;
  receipent: string;
};

export type CheckPaymentRuleAPIRequestBody = {
  providerId: string;
};

export type CheckPaymentRuleAPIResponse = {
  occured: boolean;
  thereIsNoActivePaymentRule: boolean;
};

export type CalculateBillAPIReponse = {
  postCount: number;
  pricePerPost: number;
  amount: number;
  currency: "dollar" | "matic" | "turkish_lira";
};
