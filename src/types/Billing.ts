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
  amount: number;
  currency: "dollar" | "matic" | "turkish_lira";
};
