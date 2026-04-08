import { Bubble, TranslationPair, TranslationResult } from '../types/domain';

type TranslateImagePayload = {
  imageUri: string;
  sourceLanguage: string;
  targetLanguage: string;
  glossaryContext: TranslationPair[];
};

const API_BASE_URL = 'http://localhost:3001';

export async function translateImage(payload: TranslateImagePayload): Promise<TranslationResult> {
  const response = await fetch(`${API_BASE_URL}/translate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Translation request failed: ${message}`);
  }

  return (await response.json()) as TranslationResult;
}

export function toGlossaryPairs(
  bubbles: Array<Bubble & { translatedText: string }>,
  sourceLanguage: string,
  targetLanguage: string,
): TranslationPair[] {
  const createdAt = new Date().toISOString();
  return bubbles
    .filter((bubble) => bubble.sourceText.trim().length > 0 && bubble.translatedText.trim().length > 0)
    .map((bubble) => ({
      sourceText: bubble.sourceText,
      translatedText: bubble.translatedText,
      sourceLanguage,
      targetLanguage,
      createdAt,
    }));
}
