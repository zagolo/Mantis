import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { BootstrapResponse } from "../shared/contracts";
import { fetchBootstrap, fetchSession } from "./state/api";
import { SessionProvider } from "./state/session";
import { AppLayout } from "./layout/AppLayout";
import { LeadsPage } from "./pages/LeadsPage";
import { LeadDetailPage } from "./pages/LeadDetailPage";
import { ReviewPage } from "./pages/ReviewPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { EmptyState } from "./components/EmptyState";
import { bootSkeleton, LoginSkeleton } from "./components/LoadingSkeleton";
import { EMPTY_COPY, PAGE_TITLES, PRODUCT_NAME } from "./copy";
import { SHELL } from "./layout/shell";
import { usePageTitle } from "./usePageTitle";

function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

export function App() {
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}

function AuthGate() {
  const location = useLocation();
  const [auth, setAuth] = useState<"checking" | "loading" | "guest" | "ready">("checking");
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enterApp = useCallback(async () => {
    setAuth("loading");
    setError(null);
    try {
      const data = await fetchBootstrap();
      setBootstrap(data);
      setAuth("ready");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load";
      setBootstrap(null);
      if (message === "Sign in required") {
        setError(null);
        setAuth("guest");
        return;
      }
      setError(message);
      setAuth("guest");
    }
  }, []);

  const checkSession = useCallback(async () => {
    setAuth("checking");
    setError(null);
    try {
      const session = await fetchSession();
      if (session.authenticated) await enterApp();
      else setAuth("guest");
    } catch {
      setError("Could not check your session. Check the connection and retry.");
      setAuth("guest");
    }
  }, [enterApp]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (error && auth !== "ready") {
    return <BootstrapError onRetry={() => void checkSession()} />;
  }

  if (auth === "checking" || auth === "loading") {
    if (isAuthPath(location.pathname)) {
      return (
        <div className="flex min-h-dvh flex-col">
          <BootTitle title={location.pathname.startsWith("/signup") ? PAGE_TITLES.signup : PAGE_TITLES.login} />
          <LoginSkeleton fields={location.pathname.startsWith("/signup") ? 3 : 2} />
        </div>
      );
    }
    return (
      <div className="flex min-h-dvh flex-col lg:h-dvh lg:overflow-hidden">
        <header className="sticky top-0 z-50 bg-background">
          <div className="h-[3px] bg-accent" />
          <div className={`${SHELL} flex h-14 min-w-0 items-center gap-2 sm:gap-6`}>
            <p className="flex shrink-0 items-center gap-2 text-[15px] font-semibold tracking-tight">
              <span className="flex size-6 items-center justify-center">
                <img src="/icon-192.png" alt="" width={20} height={20} className="size-5" />
              </span>
              {PRODUCT_NAME}
            </p>
            {auth === "loading" ? (
              <nav className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-3 text-xs sm:gap-5 sm:text-sm" aria-label="Workspace">
                <Link to="/leads" className="hover:text-accent">Queue</Link>
                <Link to="/analytics" className="hover:text-accent">Analytics</Link>
                <Link to="/notifications" className="hover:text-accent">Notifications</Link>
                <Link to="/settings" className="hover:text-accent">Settings</Link>
              </nav>
            ) : (
              <div className="ml-auto flex items-center gap-2" aria-hidden="true">
                <div className="h-3.5 w-20 rounded-full bg-surface-secondary" />
                <div className="hidden h-3.5 w-16 rounded-full bg-surface-secondary sm:block" />
              </div>
            )}
          </div>
        </header>
        <main className={`${SHELL} flex min-h-0 flex-1 flex-col py-4 sm:py-5 lg:overflow-hidden lg:pb-5`}>
          {bootSkeleton(location.pathname)}
        </main>
      </div>
    );
  }

  if (auth === "guest" || !bootstrap) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoggedIn={() => void enterApp()} />} />
        <Route path="/signup" element={<SignupPage onLoggedIn={() => void enterApp()} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <SessionProvider initial={bootstrap}>
      <Routes>
        <Route path="/login" element={<Navigate to="/leads" replace />} />
        <Route path="/signup" element={<Navigate to="/leads" replace />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/leads" replace />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:leadId" element={<LeadDetailPage />} />
          <Route path="/calls/:sessionId/review" element={<ReviewPage />} />
          <Route path="/diagnostics" element={<Navigate to="/notifications#queue" replace />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/review" element={<Navigate to="/leads" replace />} />
          <Route path="*" element={<Navigate to="/leads" replace />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}

function BootstrapError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 bg-background">
        <div className="h-[3px] bg-accent" />
        <div className={`${SHELL} flex h-14 items-center`}>
          <p className="text-[15px] font-semibold tracking-tight">{PRODUCT_NAME}</p>
        </div>
      </header>
      <main className={`${SHELL} flex min-h-[calc(100vh-3.75rem)] items-center py-8`}>
        <EmptyState
          icon="error"
          role="alert"
          title={EMPTY_COPY.bootstrap.title}
          description="Workspace could not load. No changes were made. Check the connection and retry."
          action={<button type="button" className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground" onClick={onRetry}>Retry loading workspace</button>}
        />
      </main>
    </div>
  );
}

function BootTitle({ title }: { title: string }) {
  usePageTitle(title);
  return null;
}
