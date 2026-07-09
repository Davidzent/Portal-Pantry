import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "./Icon";
import { ApiError, login, register, type User, type UserRole } from "../api/authApi";
import { PortalMark } from "./PortalMark";

interface LoginModalProps {
  onSuccess: (user: User) => void;
  onClose: () => void;
}

type Mode = "signin" | "register";

export default function LoginModal({ onSuccess, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [role, setRole] = useState<UserRole>("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isRegister = mode === "register";
  const isOwner = role === "owner";

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = isRegister
        ? await register(email, password, {
            name,
            role,
            restaurantName: isOwner ? restaurantName : undefined,
          })
        : await login(email, password);
      onSuccess(user);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "The auth server fell into a wormhole. Try again.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="pp-backdrop" onClick={onClose}>
      <div
        className="pp-modal pp-login"
        role="dialog"
        aria-modal="true"
        aria-label={isRegister ? "Create account" : "Sign in"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="pp-iconbtn pp-close"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="pp-login-body">
          <span className="pp-login-emoji" aria-hidden="true">
            <PortalMark size={40} />
          </span>
          <h2 className="pp-checkout-title">
            {isRegister ? "Join the multiverse" : "Beam in"}
          </h2>

          <div className="pp-role-toggle" role="group" aria-label="Auth mode">
            <button
              type="button"
              className={mode === "signin" ? "active" : undefined}
              aria-pressed={mode === "signin"}
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              disabled={busy}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : undefined}
              aria-pressed={mode === "register"}
              onClick={() => {
                setMode("register");
                setError("");
              }}
              disabled={busy}
            >
              Create account
            </button>
          </div>

          <form className="pp-login-form" onSubmit={submit}>
            {isRegister && (
              <div className="pp-role-toggle" role="group" aria-label="Account type">
                <button
                  type="button"
                  className={role === "customer" ? "active" : undefined}
                  aria-pressed={role === "customer"}
                  onClick={() => setRole("customer")}
                  disabled={busy}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={role === "owner" ? "active" : undefined}
                  aria-pressed={role === "owner"}
                  onClick={() => setRole("owner")}
                  disabled={busy}
                >
                  Store owner
                </button>
              </div>
            )}

            {isRegister && (
              <label className="pp-field">
                <span>Your name</span>
                <input
                  ref={firstFieldRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rick Sanchez"
                  autoComplete="name"
                  disabled={busy}
                />
              </label>
            )}

            <label className="pp-field">
              <span>Email</span>
              <input
                ref={isRegister ? undefined : firstFieldRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dimension-c131.com"
                autoComplete="email"
                disabled={busy}
              />
            </label>

            <label className="pp-field">
              <span>Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isRegister ? "new-password" : "current-password"}
                disabled={busy}
              />
            </label>

            {isRegister && isOwner && (
              <label className="pp-field">
                <span>Restaurant name</span>
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Grandma Zorp's"
                  disabled={busy}
                />
              </label>
            )}

            {error && (
              <p className="pp-login-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="pp-btn pp-btn-primary pp-btn-block"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="pp-spin" aria-hidden="true" />
                  {isRegister ? "Creating account…" : "Verifying across timelines…"}
                </>
              ) : (
                <>
                  <Icon name="user" size={16} />
                  {isRegister ? "Create account" : "Sign in"}
                </>
              )}
            </button>
          </form>

          <p className="pp-login-note">
            {isRegister
              ? isOwner
                ? "You'll get a brand-new kitchen to manage — set its photo, dishes, and details from your dashboard."
                : "Free forever in every reality. The backend is mocked in-browser; nothing leaves your machine."
              : "Demo: sign in as owner@neutrino.pp (any 4+ char password), or create your own account."}
          </p>
        </div>
      </div>
    </div>
  );
}
