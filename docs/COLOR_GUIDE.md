# Color scheme — Green (AgriRise)

Forest green primary, teal water accents.

## Where to change colors

| Purpose | File |
|--------|------|
| **TS/React** | `src/constants/colors.tsx` — use `colors.primary`, etc. |
| **CSS** | `src/styles/variables.css` — `:root` vars; use `var(--color-*)` in modules |

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#00684A` | Buttons, chips, links, accents |
| `primaryLight` | `#00ED64` | Highlights |
| `waterPrimary` | `#2F6F73` | Teal accent |
| `waterLight` | `#E3F3F2` | Soft backgrounds |
| `primaryBackground` | `#001E2B` | Dark (e.g. table borders) |
| `secondaryBackground` | `#023430` | Evergreen |
| `mutedBackground` | `#F0F3F2` | Sidebar, cards |
| `textPrimary` | `#000000` | Body text |
| `textSecondary` | `#C1C7C6` | Muted text |
| `border` | `#E8EDEB` | Borders, dividers |

Opacity helpers: `--color-primary-08`, `-10`, `-12`, `-18`, `-30`, `--color-water-08`, `-12`.
