#!/usr/bin/env bash
# Regenerate the self-hosted webfonts in src/app/fonts/.
#
# Run once at authoring time — the output is committed, so a normal build needs
# neither python nor network access.
#
#   pip install fonttools brotli
#   bash scripts/build-fonts.sh
#
# Sources (all SIL Open Font License 1.1):
#   Bricolage Grotesque  — display  https://fonts.google.com/specimen/Bricolage+Grotesque
#   Public Sans          — body     https://fonts.google.com/specimen/Public+Sans
#   Spline Sans Mono     — utility  https://fonts.google.com/specimen/Spline+Sans+Mono
#
# We pull the complete upstream variable fonts — NOT the pre-sliced files the
# Google Fonts CSS API serves, because those are already cut to a unicode-range
# and you cannot subset a glyph back in. Then we cut them to the glyphs this app
# actually renders, and pin Bricolage's `opsz` axis to 40: the display face is
# only ever used between 20px and 56px, so a fixed optical size costs nothing
# visually and drops that file by ~40%.
#
# Glyph gaps, checked against all three faces: none of them ships U+2605 (star),
# U+01B6 or U+03A9. So ratings use the SVG star in components/Icon.tsx, the
# currency sign is U+00A4, and the dimension code is spelled OMEGA-77.

set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/app/fonts
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

GH=https://raw.githubusercontent.com/google/fonts/main/ofl

ASCII="U+0020-007E,U+00A0"
PUNCT="U+2013,U+2014,U+2018-2019,U+201C-201D,U+2026"
# Glyphs the bureaucratic voice leans on: currency, section, degree, plus-minus,
# pilcrow, multiplication, dagger, double-dagger.
BUREAU="U+00A4,U+00A7,U+00B0,U+00B1,U+00B6,U+00D7,U+2020,U+2021"

echo "-> display (Bricolage Grotesque)"
curl -sfL "$GH/bricolagegrotesque/BricolageGrotesque%5Bopsz,wdth,wght%5D.ttf" -o "$TMP/display.ttf"
python -m fontTools.subset "$TMP/display.ttf" --flavor=woff2 --output-file="$TMP/display-sub.woff2" \
  --unicodes="$ASCII,$PUNCT,$BUREAU" \
  --layout-features="kern,liga,calt,ccmp,locl" --no-hinting --desubroutinize
python - "$TMP/display-sub.woff2" "$OUT/display.woff2" <<'PY'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
f = instancer.instantiateVariableFont(TTFont(sys.argv[1]), {"opsz": 40}, inplace=False)
f.flavor = "woff2"
f.save(sys.argv[2])
PY

echo "-> body (Public Sans)"
curl -sfL "$GH/publicsans/PublicSans%5Bwght%5D.ttf" -o "$TMP/body.ttf"
python -m fontTools.subset "$TMP/body.ttf" --flavor=woff2 --output-file="$OUT/body.woff2" \
  --unicodes="$ASCII,U+00A1-00FF,U+0131,U+0152-0153,$PUNCT,$BUREAU,U+2022,U+2039-203A,U+20AC,U+2122,U+2212" \
  --layout-features="kern,liga,calt,ccmp,locl,tnum" --no-hinting

echo "-> utility (Spline Sans Mono)"
curl -sfL "$GH/splinesansmono/SplineSansMono%5Bwght%5D.ttf" -o "$TMP/utility.ttf"
python -m fontTools.subset "$TMP/utility.ttf" --flavor=woff2 --output-file="$OUT/utility.woff2" \
  --unicodes="$ASCII,$PUNCT,$BUREAU,U+2022,U+2192,U+2212" \
  --layout-features="kern,calt,ccmp,tnum" --no-hinting

# Metric overrides for the zero-CLS fallback @font-face rules in styles/fonts.css.
python - "$OUT" <<'PY'
import sys
from fontTools.ttLib import TTFont
ARIAL_UPEM, ARIAL_AVG = 2048, 904.0
print("\n  fallback overrides (paste into styles/fonts.css):")
for name in ("display", "body", "utility"):
    f = TTFont(f"{sys.argv[1]}/{name}.woff2")
    upem, os2 = f["head"].unitsPerEm, f["OS/2"]
    asc, desc, gap = os2.sTypoAscender, os2.sTypoDescender, os2.sTypoLineGap
    sa = (os2.xAvgCharWidth / upem) / (ARIAL_AVG / ARIAL_UPEM)
    print(f"    {name:8s} size-adjust:{sa*100:.2f}%  ascent:{asc/upem/sa*100:.2f}%  "
          f"descent:{abs(desc)/upem/sa*100:.2f}%  line-gap:{gap/upem/sa*100:.2f}%")
PY

ls -l "$OUT"
