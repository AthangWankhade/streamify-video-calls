import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("Streamify-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("Streamify-theme",theme)
    set({ theme })},
}));
