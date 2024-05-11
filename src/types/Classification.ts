export type PostThemeObject = {
  postDocPath: string;
  ts: number;
  themes: string[];
};

export type RelevanceScoredPostThemeObject = {
  postDocPath: string;
  ts: number;
  themes: string[];
  relevanceScore: number;
};

export type CombinedScoredPostThemeObject = {
  postDocPath: string;
  ts: number;
  themes: string[];
  combinedScore: number;
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

/**
 * This is the common type for user and provider servers on PostServerData.
 * We are using this type for getting post infromation from user side.
 */
export type PostServerData = {
  senderUsername: string;

  description: string;
  image: string;

  likeCount: number;
  commentCount: number;

  nftStatus: {
    convertedToNft: boolean;
    nftDocPath?: string;
  };

  creationTime: number;
};
