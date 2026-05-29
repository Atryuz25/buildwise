import { create } from 'zustand';

interface ProjectState {
  currentProjectId: string | null;
  setCurrentProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProjectId: 'default-project-123',
  setCurrentProject: (id) => set({ currentProjectId: id }),
}));
