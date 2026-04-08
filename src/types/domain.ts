export type Bubble = {
  id: string;
  sourceText: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type TranslationPair = {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
};

export type TranslationProject = {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  glossary: TranslationPair[];
  createdAt: string;
  updatedAt: string;
};

export type TranslationResult = {
  outputImageUri: string;
  bubbles: Array<
    Bubble & {
      translatedText: string;
    }
  >;
};
