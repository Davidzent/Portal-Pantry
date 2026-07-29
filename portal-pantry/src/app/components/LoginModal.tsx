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

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, []);

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
      // States what happened and what to do about it. Never apologises.
      setError(
        err instanceof ApiError
          ? err.message
          : "The register is unreachable. Nothing was changed on your account. Try again.",
      );
      setBusy(false);
    }
  };

  return (
    <div className="pp-backdrop pp-backdrop--center" onClick={onClose}>
      <div
        className="pp-modal pp-auth"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pp-auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="pp-iconbtn pp-close"
          onClick={onClose}
          aria-label="Close without signing in"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="pp-auth__head">
          <span className="pp-auth__kicker">
            <PortalMark size={24} />
            <span className="pp-code">Carrier account</span>
          </span>
          <h2 className="pp-auth__title" id="pp-auth-title">
            {isRegister ? "Open an account" : "Sign in"}
          </h2>
          <p className="pp-auth__sub">
            {isRegister
              ? "One account per version of you. We do not check, but the couriers do."
              : "Accounts are valid in the dimension they were opened in. Yours is probably this one."}
          </p>
        </div>

        <div className="pp-segment" role="group" aria-label="Account action">
          <button
            type="button"
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
            aria-pressed={mode === "register"}
            onClick={() => {
              setMode("register");
              setError("");
            }}
            disabled={busy}
          >
            New account
          </button>
        </div>

        <form className="pp-auth__form" onSubmit={submit}>
          {isRegister && (
            <div className="pp-segment" role="group" aria-label="Account type">
              <button
                type="button"
                aria-pressed={role === "customer"}
                onClick={() => setRole("customer")}
                disabled={busy}
              >
                Ordering
              </button>
              <button
                type="button"
                aria-pressed={role === "owner"}
                onClick={() => setRole("owner")}
                disabled={busy}
              >
                Kitchen
              </button>
            </div>
          )}

          {isRegister && (
            <label className="pp-form-row">
              <span className="pp-field-label">Name on the account</span>
              <span className="pp-field">
                <input
                  ref={firstFieldRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="A. Trembley"
                  autoComplete="name"
                  disabled={busy}
                />
              </span>
            </label>
          )}

          <label className="pp-form-row">
            <span className="pp-field-label">Email</span>
            <span className="pp-field">
              <input
                ref={isRegister ? undefined : firstFieldRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@meridian-9.pp"
                autoComplete="email"
                disabled={busy}
              />
            </span>
          </label>

          <label className="pp-form-row">
            <span className="pp-field-label">Password</span>
            <span className="pp-field">
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least four characters"
                autoComplete={isRegister ? "new-password" : "current-password"}
                disabled={busy}
              />
            </span>
          </label>

          {isRegister && isOwner && (
            <label className="pp-form-row">
              <span className="pp-field-label">Kitchen name</span>
              <span className="pp-field">
                <input
                  type="text"
                  required
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Grandma Zorp's"
                  autoComplete="organization"
                  disabled={busy}
                />
              </span>
            </label>
          )}

          {error && (
            <p className="pp-alert" role="alert">
              <Icon name="alert" size={18} />
              {error}
            </p>
          )}

          <button type="submit" className="pp-btn pp-btn--block" disabled={busy}>
            {busy ? (
              <>
                {isRegister ? "Filing the paperwork…" : "Checking the register…"}
              </>
            ) : (
              <>
                <Icon name="user" size={16} />
                {isRegister ? "Open the account" : "Sign in"}
              </>
            )}
          </button>
        </form>

        <p className="pp-fine pp-auth__note">
          {isRegister
            ? isOwner
              ? "You will be issued an empty kitchen and a licence number. Stock it from the kitchen desk."
              : "No charge, in any currency. The backend is mocked in your browser — nothing leaves this machine."
            : null}
          {!isRegister && (
            <>
              Demo credentials: <code>owner@neutrino.pp</code> with any password
              of four characters or more. Or open an account; it costs nothing
              and persists only in this browser.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
