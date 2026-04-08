# Manga/Manhwa Image Translator

Starting with a **desktop-first app** so you can validate the complete translation workflow before investing in Android UI work.

## Desktop app (current focus)

Implemented in Python + Tkinter at `desktop/app.py`.

### What you can test now

- Create project contexts (source/target language per series).
- Keep project glossary memory across sessions.
- Load image from disk and request translation from backend.
- Persist returned bubble translations to improve consistency over time.

### Run desktop app

```bash
python3 desktop/app.py
```

See `desktop/README.md` for full details.

## Next step

After desktop flow is validated end-to-end, we can port the same project/context model to Android (React Native or native Kotlin).
