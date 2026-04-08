from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from typing import Any
import uuid


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class TranslationPair:
    source_text: str
    translated_text: str
    source_language: str
    target_language: str
    created_at: str = field(default_factory=now_iso)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class Project:
    id: str
    name: str
    source_language: str
    target_language: str
    glossary: list[TranslationPair]
    created_at: str
    updated_at: str

    @classmethod
    def create(cls, name: str, source_language: str, target_language: str) -> "Project":
        created = now_iso()
        return cls(
            id=str(uuid.uuid4()),
            name=name,
            source_language=source_language,
            target_language=target_language,
            glossary=[],
            created_at=created,
            updated_at=created,
        )

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "Project":
        glossary = [TranslationPair(**item) for item in payload.get("glossary", [])]
        return cls(
            id=payload["id"],
            name=payload["name"],
            source_language=payload["source_language"],
            target_language=payload["target_language"],
            glossary=glossary,
            created_at=payload["created_at"],
            updated_at=payload["updated_at"],
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "source_language": self.source_language,
            "target_language": self.target_language,
            "glossary": [pair.to_dict() for pair in self.glossary],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
