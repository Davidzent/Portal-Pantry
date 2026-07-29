import { Icon } from "./Icon";

/**
 * A five-star rating.
 *
 * Drawn, not typed: none of the three self-hosted faces ships U+2605, so the
 * literal "★" fell back to a system font and broke the type on every rating
 * row. The SVG star also takes the same ink weight as the rest of the icons.
 */
export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="pp-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          className={n <= rating ? undefined : "pp-stars__off"}
        />
      ))}
    </span>
  );
}
