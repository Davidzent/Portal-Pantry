import { receipt } from "../../data/portalPantry";
import { SectionHead } from "../components/SectionHead";

/** RECEIPT — the tech stack as an itemized thermal-paper receipt. */
export function ReceiptSection() {
  return (
    <div className="cs-shell">
      <SectionHead label={receipt.label} id="receipt-title" />
      <div className="cs-receipt-wrap">
        <div className="cs-receipt">
          <div className="cs-receipt-head">
            <strong>{receipt.header.store}</strong>
            <span>{receipt.header.line1}</span>
            <span>{receipt.header.line2}</span>
          </div>

          <ul className="cs-receipt-lines">
            {receipt.lines.map((line) => (
              <li
                key={line.item}
                className="cs-receipt-line"
                data-zero={line.qty === "0"}
              >
                <span className="qty">{line.qty}×</span>
                <span className="item">{line.item}</span>
                <span className="note">{line.note}</span>
              </li>
            ))}
          </ul>

          <div className="cs-receipt-totals">
            <p className="cs-receipt-row">
              <span>{receipt.totals.subtotalLabel}</span>
              <span className="dots" aria-hidden="true" />
              <span>{receipt.totals.subtotalValue}</span>
            </p>
            <p className="cs-receipt-row">
              <span>{receipt.totals.tollLabel}</span>
              <span className="dots" aria-hidden="true" />
              <span>{receipt.totals.tollValue}</span>
            </p>
            <p className="cs-receipt-total">
              <span>{receipt.totals.totalLabel}</span>
              <span>{receipt.totals.totalValue}</span>
            </p>
            <p className="cs-receipt-punchline">{receipt.punchline}</p>
          </div>

          <div className="cs-receipt-barcode" aria-hidden="true" />
          {receipt.footer.map((line) => (
            <p key={line} className="cs-receipt-footer">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
