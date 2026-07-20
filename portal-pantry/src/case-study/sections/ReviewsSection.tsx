import { reviews } from "../../data/portalPantry";
import { SectionHead } from "../components/SectionHead";

/** REVIEWS — the Vitest suite as verified customer reviews + a health placard. */
export function ReviewsSection() {
  return (
    <div className="cs-shell">
      <SectionHead label={reviews.label} sub={reviews.sub} id="reviews-title" />

      <div className="cs-reviews-layout">
        <aside className="cs-placard" aria-label="Test-suite summary placard">
          <p className="cs-placard-heading">{reviews.placard.heading}</p>
          <p className="cs-placard-grade" aria-label={`Grade ${reviews.placard.grade}`}>
            {reviews.placard.grade}
          </p>
          <p className="cs-placard-line">{reviews.placard.line}</p>
          <p className="cs-placard-detail">{reviews.placard.detail}</p>
          <p className="cs-placard-inspector">{reviews.placard.inspector}</p>
        </aside>

        <div>
          <ul className="cs-review-list">
            {reviews.entries.map((entry) => (
              <li key={entry.body} className="cs-review">
                <span
                  className="cs-review-stars"
                  aria-label={`${entry.stars} out of 5 stars`}
                >
                  {"★".repeat(entry.stars)}
                </span>
                <p className="cs-review-body">{entry.body}</p>
                <span className="cs-review-source">{entry.source}</span>
              </li>
            ))}
          </ul>
          <p className="cs-reviews-footnote">{reviews.footnote}</p>
        </div>
      </div>
    </div>
  );
}
