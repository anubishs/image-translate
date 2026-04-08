from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from urllib import request, error

from models import TranslationPair


def translate_image(
    api_base_url: str,
    image_path: Path,
    source_language: str,
    target_language: str,
    glossary_context: list[TranslationPair],
) -> dict[str, Any]:
    payload = {
        "imageUri": str(image_path.resolve()),
        "sourceLanguage": source_language,
        "targetLanguage": target_language,
        "glossaryContext": [pair.to_dict() for pair in glossary_context],
    }

    req = request.Request(
        f"{api_base_url.rstrip('/')}/translate-image",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Translation request failed ({exc.code}): {body}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"Could not reach translation API: {exc.reason}") from exc
