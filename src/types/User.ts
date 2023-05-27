export interface UserInServer {
  name: string;
  email: string;
  description: string;
  image: string;

  revenue: number;
  score: number;
  clientCount: number;

  algorithm: string;

  uid: string;
}

export interface CurrentUser {
  name: string;
  email: string;
  description: string;
  image: string;

  revenue: number;
  score: number;
  clientCount: number;

  uid: string;

  algorithm: string;

  isThereCurrentUser: boolean;
}

export const DefaultCurrentUser: CurrentUser = {
  name: "",
  description: "",
  email: "",
  image: "",

  revenue: -1,
  score: -1,
  clientCount: -1,

  uid: "",
  algorithm: "",
  isThereCurrentUser: false,
};

export interface IShowcaseItem {
  name: string;
  description: string;
  image: string;

  score: number;
  clientCount: number;

  minPrice: number;
  maxPrice: number;
}

export interface IDealResult {
  name: string;
  startTime: number;
  endTime: number;
}
