import { useCallback, useEffect, useMemo, useState } from 'react';
import { TranslationProject } from '../types/domain';
import * as storage from '../services/storage';

export function useProjects() {
  const [projects, setProjects] = useState<TranslationProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const loaded = await storage.getProjects();
      setProjects(loaded);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const actions = useMemo(
    () => ({
      async create(name: string, sourceLanguage: string, targetLanguage: string) {
        const project = await storage.createProject(name, sourceLanguage, targetLanguage);
        await refresh();
        return project;
      },
      async addGlossary(projectId: string, pairs: Parameters<typeof storage.appendGlossary>[1]) {
        await storage.appendGlossary(projectId, pairs);
        await refresh();
      },
    }),
    [refresh],
  );

  return {
    projects,
    isLoading,
    refresh,
    ...actions,
  };
}
