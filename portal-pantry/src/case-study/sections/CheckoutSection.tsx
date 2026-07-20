import { checkout, site } from "../../data/portalPantry";
import { SectionHead } from "../components/SectionHead";

/**
 * CHECKOUT — the close. "Your order" summarizes the sections (ticks fill in
 * as they're viewed), then the demo/source CTAs and the "Order again" row.
 */
export function CheckoutSection({ visited }: { visited: ReadonlySet<string> }) {
  return (
    <div className="cs-shell">
      <SectionHead label={checkout.label} sub={checkout.sub} id="checkout-title" />

      <div className="cs-checkout-layout">
        <div className="cs-summary" aria-label="Case-study summary as an order ticket">
          <h3>Order summary</h3>
          <ul>
            {checkout.summary.map((item) => {
              const done = visited.has(item.id);
              return (
                <li key={item.id} className="cs-summary-item" data-done={done}>
                  <span className="tick" aria-hidden="true">
                    ✓
                  </span>
                  <span className="label">{item.label}</span>
                  <span className="dots" aria-hidden="true" />
                  <span className="detail">{item.detail}</span>
                  <span className="sr-only">{done ? "— viewed" : "— not viewed yet"}</span>
                </li>
              );
            })}
          </ul>
          <p className="cs-summary-total">
            <span>{checkout.totalRow.label}</span>
            <span>{checkout.totalRow.value}</span>
          </p>
        </div>

        <div>
          <div className="cs-checkout-ctas">
            <a className="cs-btn cs-btn-primary" href={checkout.ctas.place.href}>
              {checkout.ctas.place.label}
              <small>{checkout.ctas.place.note}</small>
            </a>
            <a
              className="cs-btn cs-btn-ghost"
              href={checkout.ctas.save.href}
              target="_blank"
              rel="noreferrer"
            >
              {checkout.ctas.save.label}
              <small>{checkout.ctas.save.note}</small>
            </a>
          </div>

          <div className="cs-order-again">
            <h3>{checkout.orderAgain.heading}</h3>
            <p className="sub">{checkout.orderAgain.sub}</p>
            <ul>
              {checkout.orderAgain.items.map((item) => (
                <li key={item.name}>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    <span className="name">{item.name}</span>
                    <span className="note">{item.note}</span>
                    <span className="arrow" aria-hidden="true">
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <footer className="cs-footer">
        <span>{checkout.footer.legal}</span>
        <span>
          <a href={site.portfolioHref}>{checkout.footer.credit}</a>
        </span>
      </footer>
    </div>
  );
}
