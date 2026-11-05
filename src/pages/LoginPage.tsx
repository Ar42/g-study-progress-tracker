import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Button, Field, IconButton, Input } from "../components/ui";
import { Logo } from "../components/ui/Logo";
import { isAuthenticated, login } from "../features/auth/session";
import { ThemeToggle } from "../layouts/ThemeToggle";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  if (isAuthenticated()) return <Navigate to={from} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (login(username, password)) navigate(from, { replace: true });
    else setError("That username and password don't match.");
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <ThemeToggle className="absolute top-4 right-4" />

      <div className="relative w-full max-w-sm animate-rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-5 size-12" />
          <h1 className="font-display text-2xl font-semibold text-fg">Sign in to Study Tracker</h1>
          <p className="mt-1.5 text-sm text-fg-muted">Track your BCS and IT preparation in one place.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-card" noValidate>
          <Field label="Username" htmlFor="username">
            <Input
              id="username"
              leading={<User />}
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(null);
              }}
            />
          </Field>
          <Field label="Password" htmlFor="password" error={error ?? undefined}>
            <div className="relative">
              <Input
                id="password"
                leading={<Lock />}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(error)}
                className="pr-11"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
              />
              <IconButton
                label={showPassword ? "Hide password" : "Show password"}
                icon={showPassword ? <EyeOff /> : <Eye />}
                size="sm"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2"
              />
            </div>
          </Field>
          <Button type="submit" className="mt-2 w-full" disabled={!username || !password}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
