Paynote Brand Guide

Logo
- Source file: `public/logo.png` — use this as the single source-of-truth for raster usages.
- For app chrome and avatars prefer square usage with rounded corners, do not alter aspect ratio.

Colors
- Primary: `#007AFF` (var(--brand-primary))
- Secondary: `#5856D6` (var(--brand-secondary))
- Accent: gradient from primary → secondary (var(--brand-accent))
- Foreground: `#0f172a` (var(--brand-foreground))

SVG icons
- Vector icons are created in `src/components/icons/*.jsx` and are intentionally simple, single-color or gradient-aware.
- Use the icons as React components (they accept a `size` prop).

Usage
- Header and sidebar use `/logo.png` directly for fidelity. For iconography, prefer the SVG components for crisp scaling and programmatic color changes.
- When building marketing or other materials, use `public/logo.png` as the master file and export additional sizes from it.

Accessibility
- All icons include accessible labels where relevant. Keep `alt` text meaningful (e.g., "Paynote logo").

Adding more assets
- If you want an SVG version of the original logo, add `public/logo.svg` and I'll wire it into the build.
