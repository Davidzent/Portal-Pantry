# Bundled webfonts

Three self-hosted, subset variable fonts. Regenerate with
`bash ../../../scripts/build-fonts.sh` (needs `pip install fonttools brotli`).

| File | Family | Role | Upstream |
| --- | --- | --- | --- |
| `display.woff2` | Bricolage Grotesque | wordmark, headings | [google/fonts · ofl/bricolagegrotesque](https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque) |
| `body.woff2` | Public Sans | body copy | [google/fonts · ofl/publicsans](https://github.com/google/fonts/tree/main/ofl/publicsans) |
| `utility.woff2` | Spline Sans Mono | codes, IDs, prices, disclaimers | [google/fonts · ofl/splinesansmono](https://github.com/google/fonts/tree/main/ofl/splinesansmono) |

Sources are the **complete upstream variable TTFs** from the `google/fonts`
repository — not the pre-sliced files the Google Fonts CSS API serves. Those are
already cut to a `unicode-range`, and a glyph that has been subset out cannot be
subset back in.

## Licence

All three are licensed under the **SIL Open Font License, Version 1.1**. The
full licence text for each family ships alongside the fonts, as OFL section 2
requires of any redistributed copy:

- `OFL-bricolagegrotesque.txt`
- `OFL-publicsans.txt`
- `OFL-splinesansmono.txt`

These files are modified copies (subset, and Bricolage's `opsz` axis pinned to
40). The OFL permits that; none of the families is Reserved Font Name
restricted, and the app declares them internally as `PP Display`, `PP Body` and
`PP Utility`, so no reserved name is reused.
