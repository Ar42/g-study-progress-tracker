import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, User, LogIn } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const envUsername = import.meta.env.VITE_AUTH_USERNAME || "admin";
    const envPassword = import.meta.env.VITE_AUTH_PASSWORD || "password123";

    setTimeout(() => {
      if (username === envUsername && password === envPassword) {
        // Save session in a cookie for 7 days (604800 seconds)
        document.cookie = "auth_session=true; max-age=604800; path=/; SameSite=Strict; Secure";
        toast.success("Welcome back! Login successful.");
        navigate("/");
      } else {
        toast.error("Invalid username or password. Please try again.");
      }
      setIsLoading(false);
    }, 600); // Slight delay for realistic feedback
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-bg-surface border border-border-subtle shadow-2xl glass-panel relative z-10 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4 animate-bounce">
            <span className="font-bold text-text-primary text-2xl">G</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary text-center">
            Study Tracker Login
          </h1>
          <p className="text-xs text-text-muted mt-2 text-center">
            Enter your credentials to access your private progress board
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <User className="h-4.5 w-4.5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-bg-base border border-border-subtle rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <Lock className="h-4.5 w-4.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-bg-base border border-border-subtle rounded-xl pl-11 pr-11 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary text-text-primary font-bold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/25 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 rounded-full border-2 border-text-primary border-t-transparent animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Access Board
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

LoginPage.displayName = "LoginPage";
export default LoginPage;
