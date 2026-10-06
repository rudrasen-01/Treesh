import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { settingsAPI } from "@/services/api";

/** Apply theme from server settings once the user is authenticated */
export function ThemePreferenceSync() {
  const { isAuthenticated, isLoading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const localTheme = localStorage.getItem("theme");
    if (
      localTheme === "light" ||
      localTheme === "dark" ||
      localTheme === "system"
    ) {
      setTheme(localTheme);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await settingsAPI.getSettings();
        if (cancelled || !res.success || !res.data?.app?.theme) return;
        const t = res.data.app.theme;
        if (t === "light" || t === "dark" || t === "system") setTheme(t);
      } catch {
        /* ignore — keep localStorage / default */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, setTheme]);

  return null;
}
