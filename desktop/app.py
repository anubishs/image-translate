from __future__ import annotations

from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox

from api import translate_image
from models import Project, TranslationPair
from storage import append_glossary, create_project, load_projects

API_BASE_URL = "http://localhost:3001"


class DesktopTranslatorApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("Manga/Manhwa Image Translator (Desktop)")
        self.root.geometry("1000x700")

        self.projects: list[Project] = load_projects()
        self.selected_project: Project | None = self.projects[0] if self.projects else None
        self.selected_image: Path | None = None
        self.output_image: str | None = None

        self.project_name_var = tk.StringVar()
        self.source_lang_var = tk.StringVar(value="ja")
        self.target_lang_var = tk.StringVar(value="en")
        self.api_url_var = tk.StringVar(value=API_BASE_URL)
        self.image_path_var = tk.StringVar(value="No image selected")
        self.output_path_var = tk.StringVar(value="No translated image yet")
        self.status_var = tk.StringVar(value="Ready")

        self._build_layout()
        self._refresh_projects_listbox()

    def _build_layout(self) -> None:
        frame = tk.Frame(self.root, padx=12, pady=12)
        frame.pack(fill="both", expand=True)

        top = tk.LabelFrame(frame, text="Project context", padx=10, pady=10)
        top.pack(fill="x")

        tk.Label(top, text="Project").grid(row=0, column=0, sticky="w")
        tk.Entry(top, textvariable=self.project_name_var, width=26).grid(row=0, column=1, sticky="we", padx=6)
        tk.Label(top, text="Source").grid(row=0, column=2, sticky="w")
        tk.Entry(top, textvariable=self.source_lang_var, width=8).grid(row=0, column=3, padx=6)
        tk.Label(top, text="Target").grid(row=0, column=4, sticky="w")
        tk.Entry(top, textvariable=self.target_lang_var, width=8).grid(row=0, column=5, padx=6)
        tk.Button(top, text="Create project", command=self.create_project).grid(row=0, column=6, padx=6)

        middle = tk.PanedWindow(frame, orient="horizontal")
        middle.pack(fill="both", expand=True, pady=(12, 0))

        left_panel = tk.LabelFrame(middle, text="Projects", padx=8, pady=8)
        right_panel = tk.LabelFrame(middle, text="Translation", padx=8, pady=8)
        middle.add(left_panel, minsize=280)
        middle.add(right_panel)

        self.project_list = tk.Listbox(left_panel, height=20)
        self.project_list.pack(fill="both", expand=True)
        self.project_list.bind("<<ListboxSelect>>", self.on_select_project)

        tk.Label(right_panel, text="API URL").pack(anchor="w")
        tk.Entry(right_panel, textvariable=self.api_url_var).pack(fill="x", pady=(0, 8))

        tk.Button(right_panel, text="Pick image", command=self.pick_image).pack(anchor="w")
        tk.Label(right_panel, textvariable=self.image_path_var, fg="#333", justify="left", wraplength=560).pack(anchor="w", pady=(4, 8))

        tk.Button(right_panel, text="Translate image", command=self.translate).pack(anchor="w")
        tk.Label(right_panel, text="Output image URI/path:").pack(anchor="w", pady=(12, 0))
        tk.Label(right_panel, textvariable=self.output_path_var, fg="#0a4", justify="left", wraplength=560).pack(anchor="w")

        glossary_frame = tk.LabelFrame(right_panel, text="Current project glossary preview", padx=8, pady=8)
        glossary_frame.pack(fill="both", expand=True, pady=(10, 0))
        self.glossary_text = tk.Text(glossary_frame, height=16)
        self.glossary_text.pack(fill="both", expand=True)
        self.glossary_text.config(state="disabled")

        status = tk.Label(frame, textvariable=self.status_var, anchor="w")
        status.pack(fill="x", pady=(8, 0))

    def _refresh_projects_listbox(self) -> None:
        self.projects = load_projects()
        self.project_list.delete(0, tk.END)

        for project in self.projects:
            label = f"{project.name} ({project.source_language}->{project.target_language})"
            self.project_list.insert(tk.END, label)

        if self.selected_project:
            for idx, project in enumerate(self.projects):
                if project.id == self.selected_project.id:
                    self.project_list.selection_set(idx)
                    self.project_list.see(idx)
                    break

        self._refresh_glossary_preview()

    def _refresh_glossary_preview(self) -> None:
        self.glossary_text.config(state="normal")
        self.glossary_text.delete("1.0", tk.END)

        if not self.selected_project:
            self.glossary_text.insert(tk.END, "Select a project to see glossary context.")
        else:
            for pair in self.selected_project.glossary[:40]:
                self.glossary_text.insert(
                    tk.END,
                    f"• {pair.source_text}  =>  {pair.translated_text}\n",
                )
            if not self.selected_project.glossary:
                self.glossary_text.insert(tk.END, "No glossary entries yet.")

        self.glossary_text.config(state="disabled")

    def create_project(self) -> None:
        name = self.project_name_var.get().strip()
        source = self.source_lang_var.get().strip()
        target = self.target_lang_var.get().strip()

        if not name:
            messagebox.showerror("Missing field", "Project name is required.")
            return

        project = create_project(name=name, source_language=source, target_language=target)
        self.selected_project = project
        self.project_name_var.set("")
        self.status_var.set(f"Created project: {project.name}")
        self._refresh_projects_listbox()

    def on_select_project(self, _event: tk.Event[tk.Misc]) -> None:
        selection = self.project_list.curselection()
        if not selection:
            return

        idx = selection[0]
        self.selected_project = self.projects[idx]
        self.status_var.set(f"Selected project: {self.selected_project.name}")
        self._refresh_glossary_preview()

    def pick_image(self) -> None:
        image_path = filedialog.askopenfilename(
            title="Select manga/manhwa image",
            filetypes=[("Image files", "*.png *.jpg *.jpeg *.webp"), ("All files", "*.*")],
        )
        if not image_path:
            return

        self.selected_image = Path(image_path)
        self.image_path_var.set(str(self.selected_image))
        self.status_var.set("Image selected")

    def translate(self) -> None:
        if not self.selected_project:
            messagebox.showerror("Missing project", "Create or select a project first.")
            return

        if not self.selected_image:
            messagebox.showerror("Missing image", "Select an image first.")
            return

        self.status_var.set("Translating...")
        self.root.update_idletasks()

        try:
            result = translate_image(
                api_base_url=self.api_url_var.get().strip(),
                image_path=self.selected_image,
                source_language=self.selected_project.source_language,
                target_language=self.selected_project.target_language,
                glossary_context=self.selected_project.glossary,
            )
            self.output_image = result.get("outputImageUri")
            bubbles = result.get("bubbles", [])
            pairs = []
            for bubble in bubbles:
                src = (bubble.get("sourceText") or "").strip()
                translated = (bubble.get("translatedText") or "").strip()
                if src and translated:
                    pairs.append(
                        TranslationPair(
                            source_text=src,
                            translated_text=translated,
                            source_language=self.selected_project.source_language,
                            target_language=self.selected_project.target_language,
                        )
                    )

            if pairs:
                updated = append_glossary(self.selected_project.id, pairs)
                if updated:
                    self.selected_project = updated

            self.output_path_var.set(self.output_image or "(empty response)")
            self.status_var.set(f"Done. Captured {len(pairs)} glossary entries.")
            self._refresh_projects_listbox()
        except Exception as exc:  # noqa: BLE001
            messagebox.showerror("Translation failed", str(exc))
            self.status_var.set("Translation failed")


def main() -> None:
    root = tk.Tk()
    app = DesktopTranslatorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
