import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const adminConfigStorage = createJSONStorage(() => ({
  getItem(name) {
    const stored = localStorage.getItem(name);
    if (stored === null) return null;
    const parsed = JSON.parse(stored);
    return JSON.stringify(typeof parsed === 'boolean'
      ? { state: { mostrarPreciosAdmin: parsed }, version: 0 }
      : parsed);
  },
  setItem(name, value) {
    localStorage.setItem(name, value);
  },
  removeItem(name) {
    localStorage.removeItem(name);
  },
}));

export const useAdminConfigStore = create(persist((set) => ({
  mostrarPreciosAdmin: true,
  toggleMostrarPreciosAdmin: () => set((state) => ({
    mostrarPreciosAdmin: !state.mostrarPreciosAdmin,
  })),
}), {
  name: 'mostrarPreciosAdmin',
  storage: adminConfigStorage,
  partialize: (state) => ({ mostrarPreciosAdmin: state.mostrarPreciosAdmin }),
}));
