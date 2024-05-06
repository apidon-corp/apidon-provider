export type PostThemeObject = {
  postDocPath: string;
  ts: number;
  themes: string[];
};

export type PostThemeObjectValued = {
  postDocPath: string;
  ts: number;
  themes: string[];
  value: number;
};

export type Post = {
  postDocPath: string;
  ts: number;
};

export type ThemeObject = {
  theme: string;
  ts: number;
};

/**
 * Can be used for getting result from classifiton APIs.
 */
export type PostPredictionObject = {
  label: string;
  score: number;
};
