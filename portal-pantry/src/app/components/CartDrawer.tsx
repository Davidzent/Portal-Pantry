import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

interface CartDrawerProps {
  onClose: () => void;
  error?: string | null;
  /** The manifest. Same component the sticky rail renders, so they cannot drift. */
  children: ReactNode;
}

/**
 * Below 1024px the manifest rail unpins and becomes this drawer. It is a shell
 * only — it owns the dialog behaviour (focus, Escape, scroll lock) and nothing
 * about how a manifest looks.
 */
export default function CartDrawer({ onClose, error, children }: CartDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
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

  return (
    <div className="pp-backdrop pp-backdrop--right" onClick={onClose}>
      <aside
        className="pp-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shipping manifest"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pp-drawer__head">
          <h2>Manifest</h2>
          <button
            ref={closeRef}
            type="button"
            className="pp-iconbtn"
            onClick={onClose}
            aria-label="Close the manifest"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {error && (
          <p className="pp-alert pp-drawer__alert">
            <Icon name="alert" size={18} />
            {error}
          </p>
        )}

        {children}
      </aside>
    </div>
  );
}
