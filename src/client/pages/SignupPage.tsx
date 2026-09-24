import { type ComponentPropsWithRef, type FormEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Link as HeroLink } from "@heroui/react";
import { AuthShell } from "../components/AuthShell";
import { AUTH_COPY, PAGE_TITLES } from "../copy";
import { signup } from "../state/api";
import { usePageTitle } from "../usePageTitle";

type SignupPageProps = {
  onLoggedIn: () => void;
};

export function SignupPage({ onLoggedIn }: SignupPageProps) {
  usePageTitle(PAGE_TITLES.signup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (password !== confirm) {
      setError(AUTH_COPY.mismatch);
      return;
    }
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await signup(email, password);
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error && /already|exists/i.test(err.message)
        ? "This email already has an account. Sign in instead."
        : "Account creation was not confirmed. Check your details and try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <AuthShell
      title={AUTH_COPY.signUpTitle}
      description={AUTH_COPY.signUpBody}
      footer={
        <>
          {AUTH_COPY.signUpFooter}{" "}
          <HeroLink render={(props) => <Link {...(props as ComponentPropsWithRef<typeof Link>)} to="/login" />}>
            {AUTH_COPY.signUpFooterAction}
          </HeroLink>
        </>
      }
    >
      <form className="mt-8 flex flex-col gap-5" onSubmit={(event) => void onSubmit(event)}>
        <label className="flex flex-col gap-2" htmlFor="email">
          <span className="text-sm font-semibold">{AUTH_COPY.email}</span>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-2" htmlFor="password">
            <span className="text-sm font-semibold">{AUTH_COPY.password}</span>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              aria-describedby="password-hint"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <p id="password-hint" className="text-xs text-muted">
            {AUTH_COPY.passwordHint}
          </p>
        </div>
        <label className="flex flex-col gap-2" htmlFor="confirm-password">
          <span className="text-sm font-semibold">{AUTH_COPY.confirmPassword}</span>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={error === AUTH_COPY.mismatch}
            aria-describedby={error === AUTH_COPY.mismatch ? "signup-error" : undefined}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        {error ? (
          <p id="signup-error" role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" isDisabled={pending} isPending={pending}>
          {pending ? AUTH_COPY.signUpPending : AUTH_COPY.signUpSubmit}
        </Button>
      </form>
    </AuthShell>
  );
}
