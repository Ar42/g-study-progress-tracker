import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { Button, Field, IconButton, Input } from "../components/ui";
import { isAuthenticated, login } from "../features/auth/session";

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
    else setError("Incorrect username or password.");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-fg">
            G
          </span>
          <h1 className="text-xl font-semibold text-fg">Sign in to Study Tracker</h1>
          <p className="mt-1 text-sm text-fg-subtle">Your private progress board</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-surface p-6" noValidate>
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
                className="pr-10"
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
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              />
            </div>
          </Field>
          <Button type="submit" className="w-full" disabled={!username || !password}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
