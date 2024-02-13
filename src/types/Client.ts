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
