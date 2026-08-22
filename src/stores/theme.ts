import { ref } from 'vue';
export type ThemeMode = 'light' | 'dark';
const stored = localStorage.getItem('blugbug-theme');
export const themeMode = ref<ThemeMode>(stored === 'dark' ? 'dark' : 'light');
export const applyTheme = (mode: ThemeMode) => { themeMode.value=mode;document.documentElement.dataset.theme=mode;localStorage.setItem('blugbug-theme',mode); };
export const initializeTheme = () => applyTheme(themeMode.value);
