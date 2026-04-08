# Desktop-first app (before Android)

This folder contains a Python desktop UI so you can test the workflow quickly before building the Android client.

## Features

- Create/select translation projects.
- Project-scoped glossary memory persisted in `~/.image_translate/projects.json`.
- Pick manga/manhwa image from disk.
- Send translation request to backend (`POST /translate-image`).
- Store returned source/translated bubble pairs back into the project glossary.

## Run

```bash
python3 desktop/app.py
```

## Backend API contract

`POST {API_BASE_URL}/translate-image`

Request fields:

- `imageUri`: absolute image path
- `sourceLanguage`: like `ja`, `ko`, `zh`
- `targetLanguage`: like `en`, `es`, `pt`
- `glossaryContext`: previous project translations

Response fields:

- `outputImageUri`: translated image location/URL
- `bubbles[]`: items containing `sourceText` and `translatedText`
