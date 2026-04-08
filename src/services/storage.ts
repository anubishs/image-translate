import AsyncStorage from '@react-native-async-storage/async-storage';
import { TranslationProject, TranslationPair } from '../types/domain';

const PROJECTS_KEY = 'translation_projects_v1';

export async function getProjects(): Promise<TranslationProject[]> {
  const raw = await AsyncStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    return [];
  }

  return JSON.parse(raw) as TranslationProject[];
}

export async function saveProjects(projects: TranslationProject[]): Promise<void> {
  await AsyncStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function createProject(
  name: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<TranslationProject> {
  const now = new Date().toISOString();
  const project: TranslationProject = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    sourceLanguage,
    targetLanguage,
    glossary: [],
    createdAt: now,
    updatedAt: now,
  };

  const projects = await getProjects();
  await saveProjects([project, ...projects]);
  return project;
}

export async function appendGlossary(
  projectId: string,
  pairs: TranslationPair[],
): Promise<TranslationProject | undefined> {
  const projects = await getProjects();
  const updated = projects.map((project) => {
    if (project.id !== projectId) {
      return project;
    }

    return {
      ...project,
      glossary: [...pairs, ...project.glossary].slice(0, 300),
      updatedAt: new Date().toISOString(),
    };
  });

  await saveProjects(updated);
  return updated.find((project) => project.id === projectId);
}
