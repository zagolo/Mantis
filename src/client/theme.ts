// Legacy storage and operating-system preference cannot opt the workspace out of dark.
export type Theme = "dark";
export function resolveTheme(): Theme { return "dark"; }
export function applyTheme(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light");
  root.classList.add("dark");
  root.dataset.theme = "dark";
  root.style.colorScheme = "dark";
}
