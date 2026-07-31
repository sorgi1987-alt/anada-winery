# Añada design system

## Character

Premium, calm and operational. Añada uses the visual restraint associated with high-quality consumer software, without compromising information density or touch ergonomics in a cellar.

## Palette

| Token | Value | Use |
|---|---:|---|
| Wine 950 | `#2A0712` | Deep overlays |
| Wine 900 | `#3A0B1D` | Brand and navigation |
| Wine 700 | `#5A122B` | Primary controls |
| Wine 600 | `#7A1E3A` | Interactive accents |
| Wine 100 | `#EFE3E7` | Selected and tinted surfaces |
| Ivory | `#F7F3ED` | Application background |
| Surface | `#FFFFFF` | Cards and panels |
| Stone | `#E7DFD6` | Dividers and empty states |
| Gold | `#B08A50` | White-wine and ageing accents |
| Success | `#4F6B57` | Completed work |
| Warning | `#B77932` | Needs attention |
| Critical | `#B54545` | Immediate review |

Colours are exposed as CSS custom properties. Status must never rely on colour alone.

## Typography

- Interface: DM Sans with system fallbacks
- Display: Manrope with system fallbacks
- Desktop operational metadata should normally be at least 10px; primary labels and body copy should normally be 12–14px.
- Do not reduce text merely to keep every card on one screen; allow the page to scroll.
- Mobile body text should normally be 16px for input and longer reading contexts.
- Operational numbers use strong weights and consistent decimal formatting.

## Geometry

- Small radius: 12px
- Standard card: 18px
- Hero and primary panel: 24–28px
- Interactive target: at least 44px where practical
- Shadows remain subtle and are reserved for hierarchy, hover and overlays.

## Operational interaction

- Mobile actions open from the bottom; desktop actions use a side sheet.
- Show the previous reading beside any new numeric reading.
- Contextual operations derive from the wine process and current stage.
- Confirm success immediately and offer undo where technically safe.
- Cellar mode increases contrast and reduces bright surfaces in dim spaces.

## Language

- Spanish is the default interface language; English is an equal, complete option.
- The language control stays visible on entry, desktop and mobile surfaces.
- Remember the selection locally and update the document language for assistive technology.
- Translate operational terminology while preserving grape varieties, winery names and Rioja place names.
- Keep labels concise enough for cellar use and narrow mobile screens.

## Imagery

- Photography must depict production: vineyard, grapes, tanks, press, barrels or bottling.
- Avoid glasses, social drinking and visible third-party labels.
- Use an overlay only when it improves legibility.
- Reserve image dimensions to avoid layout shift.
- Replace remote demonstration imagery with optimised local WebP/AVIF assets before commercial release.
