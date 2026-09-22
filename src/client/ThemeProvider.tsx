import { useEffect, type ReactNode } from "react";
import { applyTheme } from "./theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyTheme();
    window.addEventListener("storage", applyTheme);
    return () => window.removeEventListener("storage", applyTheme);
  }, []);
  return <>{children}</>;
}
