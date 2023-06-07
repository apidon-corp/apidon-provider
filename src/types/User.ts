export interface UserInServer {
  name: string;
  email: string;
  description: string;
  image: string;

  sumScore: number;
  rateCount: number;

  offer: number;
  revenue: number;

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
  offer: number;

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
  offer: -1,

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

  sumScore: number;
  rateCount: number;

  clientCount: number;
  offer: number;
}

export interface IDealResult {
  name: string;
  startTime: number;
  endTime: number;
  yield: number;
}
