# Manga/Manhwa Image Translator (React Native)

This project is a **React Native (Expo)** app scaffold for translating speech bubbles in manga/manhwa images while preserving per-series consistency through **project-based glossary memory**.

## What it does

- Creates named translation projects (source + target language).
- Stores glossary/context per project in local storage.
- Lets the user pick an image from the gallery.
- Calls a backend endpoint (`POST /translate-image`) with:
  - image URI
  - source/target languages
  - glossary context for translation consistency
- Shows the translated output image.
- Appends new source/translated pairs back to project memory.

## Why project-based context matters

Different series have different naming conventions and tone. Persisting prior translation pairs per project makes character names, techniques, and recurring phrases more consistent.

## Backend contract

Expected endpoint:

`POST http://localhost:3001/translate-image`

Request:

```json
{
  "imageUri": "file://...",
  "sourceLanguage": "ja",
  "targetLanguage": "en",
  "glossaryContext": [
    {
      "sourceText": "俺は王になる",
      "translatedText": "I will become king",
      "sourceLanguage": "ja",
      "targetLanguage": "en",
      "createdAt": "2026-04-08T00:00:00.000Z"
    }
  ]
}
```

Response:

```json
{
  "outputImageUri": "https://.../translated.png",
  "bubbles": [
    {
      "id": "bubble-1",
      "sourceText": "...",
      "translatedText": "...",
      "bounds": { "x": 0, "y": 0, "width": 0, "height": 0 }
    }
  ]
}
```

## Suggested server pipeline

1. Detect text bubbles and OCR regions.
2. Translate with LLM/MT model using project glossary as context.
3. Inpaint original text and render translated text matching bubble bounds.
4. Return output image URI + per-bubble translations.

## Run

```bash
npm install
npm run start
```
