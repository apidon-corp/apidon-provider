import { ThemeObject } from "./Classification";

export type ClientObject = {
  active: boolean;
  endTime: number;
  score: number;
  startTime: number;
  debt: number;
  withdrawn: boolean;
  themesArray: ThemeObject[];
};

/**
 *
 */
export type InteractedPostObject = {
  timestamp: number;
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
