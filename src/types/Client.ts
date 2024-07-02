import { ThemeObject } from "./Classification";

/**
 * New Version of Client Object
 */
export type ClientDocData = {
  /** Unique identifier for the client document. */
  id: string;
  /** The username of the client. */
  username: string;
  /** The start time of the client's activity, represented as a timestamp. */
  startTime: number;
  /** The optional end time of the client's activity, represented as a timestamp. If not provided, the activity is ongoing. */
  endTime?: number;
  /** A boolean indicating whether the client is currently active. */
  isActive: boolean;
  /** An array of theme objects associated with the client. */
  themesArray: ThemeObject[];
  /** Price that user choose to deal. */
  offer: number;
  /** The optional final profit calculated for the client. If not provided, the profit is yet to be determined. */
  finalProfit?: number;
};

export type RatingsDoc = {
  ratings: Rating[];
};

export type Rating = {
  username: string;
  rating: number;
};

export type ClientObject = {
  active: boolean;
  endTime: number;
  score: number;
  startTime: number;
  debt: number;
  withdrawn: boolean;
  themesArray: ThemeObject[];
};

export type InteractedPostObject = {
  creationTime: number;
  postDocPath: string;
};

/**
 * Can be used at provideProviderInformation
 */
export type ActiveProviderInformation = {
  isThereActiveProvider: boolean;

  providerData?: {
    dueDatePassed: boolean;
    withdrawn: boolean;
    additionalProviderData: {
      name: string;
      description: string;
      image: string;
      clientCount: number;
      score: number;
      userScore: number;
      yield: number;
      duration: {
        startTime: number;
        endTime: number;
      };
    };
  };
};
