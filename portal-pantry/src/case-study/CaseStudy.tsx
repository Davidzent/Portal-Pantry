import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { WipeIn } from "./components/WipeIn";
import { CartBadge } from "./components/CartBadge";
import { scrollToId } from "./lib/lenis";
import { Storefront } from "./sections/Storefront";
import { MenuSection } from "./sections/MenuSection";
import { ReceiptSection } from "./sections/ReceiptSection";
import { TrackerSection } from "./sections/TrackerSection";
import { ReviewsSection } from "./sections/ReviewsSection";
import { RolesSection } from "./sections/RolesSection";
import { CheckoutSection } from "./sections/CheckoutSection";

/**
 * The page is an order being assembled: each section that enters view is
 * "added" to the floating cart badge, and the checkout ticket ticks it off.
 */
function useSectionCart() {
  const [visited, setVisited] = useState<ReadonlySet<string>>(new Set());
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const markSeen = useCallback((id: string, plainLabel: string) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setLastAdded(plainLabel);
  }, []);

  return { visited, lastAdded, markSeen };
}

function Section({
  id,
  plain,
  hero = false,
  onSeen,
  children,
}: {
  id: string;
  plain: string;
  hero?: boolean;
  onSeen: (id: string, plain: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onSeen(id, plain);
          io.disconnect();
        }
      },
      { rootMargin: "-28% 0px -28% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [id, plain, onSeen]);

  return (
    <section ref={ref} id={id} aria-label={plain} className={hero ? undefined : "cs-section"}>
      {children}
    </section>
  );
}

export default function CaseStudy() {
  const { visited, lastAdded, markSeen } = useSectionCart();

  return (
    <>
      <a
        className="cs-skip"
        href="#menu"
        onClick={(e) => {
          // Lenis owns the scroll position; a native hash jump would be
          // eased back. Drive it through Lenis, but still move focus so
          // keyboard users land in the content.
          e.preventDefault();
          scrollToId("menu");
          document.getElementById("menu-title")?.focus();
        }}
      >
        Skip to content
      </a>
      <div className="cs-grain" aria-hidden="true" />

      <main>
        <Section id="storefront" plain="Project overview" hero onSeen={markSeen}>
          <Storefront />
        </Section>

        <Section id="menu" plain="Features" onSeen={markSeen}>
          <WipeIn flavor="app">
            <MenuSection />
          </WipeIn>
        </Section>

        <Section id="receipt" plain="Tech stack" onSeen={markSeen}>
          <WipeIn flavor="tech">
            <ReceiptSection />
          </WipeIn>
        </Section>

        <Section id="tracker" plain="Architecture" onSeen={markSeen}>
          <WipeIn flavor="tech">
            <TrackerSection />
          </WipeIn>
        </Section>

        <Section id="reviews" plain="Testing" onSeen={markSeen}>
          <WipeIn flavor="tech">
            <ReviewsSection />
          </WipeIn>
        </Section>

        <Section id="roles" plain="The two user roles" onSeen={markSeen}>
          <WipeIn flavor="app">
            <RolesSection />
          </WipeIn>
        </Section>

        <Section id="checkout" plain="Summary and links" onSeen={markSeen}>
          <WipeIn flavor="app">
            <CheckoutSection visited={visited} />
          </WipeIn>
        </Section>
      </main>

      <CartBadge visited={visited} lastAdded={lastAdded} />
    </>
  );
}
