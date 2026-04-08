from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from models import Project, TranslationPair, now_iso

DATA_DIR = Path.home() / ".image_translate"
PROJECTS_FILE = DATA_DIR / "projects.json"


def _ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_projects() -> list[Project]:
    _ensure_data_dir()
    if not PROJECTS_FILE.exists():
        return []

    payload = json.loads(PROJECTS_FILE.read_text(encoding="utf-8"))
    return [Project.from_dict(item) for item in payload]


def save_projects(projects: Iterable[Project]) -> None:
    _ensure_data_dir()
    serialized = [project.to_dict() for project in projects]
    PROJECTS_FILE.write_text(json.dumps(serialized, ensure_ascii=False, indent=2), encoding="utf-8")


def create_project(name: str, source_language: str, target_language: str) -> Project:
    projects = load_projects()
    project = Project.create(name=name, source_language=source_language, target_language=target_language)
    projects.insert(0, project)
    save_projects(projects)
    return project


def append_glossary(project_id: str, new_pairs: list[TranslationPair]) -> Project | None:
    projects = load_projects()
    updated_project: Project | None = None

    for idx, project in enumerate(projects):
        if project.id != project_id:
            continue

        merged = (new_pairs + project.glossary)[:300]
        project.glossary = merged
        project.updated_at = now_iso()
        projects[idx] = project
        updated_project = project
        break

    save_projects(projects)
    return updated_project
