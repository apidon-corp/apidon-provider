export interface UserInServer {
  name: string;
  email: string;
  description: string;
  image: string;
  price: number;
  currency: "USD" | "TL" | "MATIC" | "";
  uid: string;
}

export interface CurrentUser {
  name: string;
  email: string;
  description: string;
  image: string;
  price: number;
  currency: "USD" | "TL" | "MATIC" | "";
  uid: string;
  isThereCurrentUser: boolean;
}
