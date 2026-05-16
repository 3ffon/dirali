# Design Language — דירה לי

## Color Palette

Defined as CSS custom properties in `client/src/index.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#2563eb` | Links, active states, primary actions |
| `--primary-hover` | `#1d4ed8` | Hover on primary elements |
| `--primary-light` | `#eff6ff` | Light blue backgrounds, active toggles |
| `--text` | `#1f2937` | Body text |
| `--text-secondary` | `#6b7280` | Labels, helper text |
| `--bg` | `#f9fafb` | Page background |
| `--card-bg` | `#ffffff` | Card surfaces |
| `--border` | `#e5e7eb` | Borders, dividers |
| `--success` | `#10b981` | Positive indicators |
| `--danger` | `#ef4444` | Destructive actions, errors |
| `--warning` | `#f59e0b` | Warnings |

**TopBar gradient:** `linear-gradient(to bottom, #4F46E5, #7C3AED)` (indigo → violet)

## Typography

- **Font stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Base size:** 16px (browser default)
- **Line height:** 1.6
- **Weights:** 400 (body), 600 (headings, labels), 700 (bold accents)
- **Scale:** 0.75rem, 0.85rem, 1rem, 1.1rem, 1.3rem, 1.4rem

## Spacing

8px grid system. Common values: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`.

## Layout

- **Mobile-first:** max-width 600px, centered
- **Direction:** RTL (Hebrew)
- **Structure:** Fixed viewport height, no body scroll — scroll within content areas
- **Safe areas:** Respects device notches via `env(safe-area-inset-*)`

## Icons

**Action buttons use inline SVGs — never emoji.**

Pattern:
```jsx
<button className="icon-btn icon-btn-edit">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="..." />
  </svg>
</button>
```

Rules:
- SVG size: `20×20` rendered, `24×24` viewBox (Feather icon grid)
- Use `stroke="currentColor"` so color is inherited from the button class
- Wrap in `.icon-btn` (40×40px circle, centered flex)
- Apply a semantic color class:

| Class | Background | Text/Stroke | Use case |
|-------|-----------|-------------|----------|
| `.icon-btn-edit` | `#e8f0fe` | `#1a73e8` | Edit, general actions |
| `.icon-btn-camera` | `#f3e8ff` | `#7c3aed` | Camera, media capture |
| `.icon-btn-call` | `#e6f4ea` | `#1e8e3e` | Phone/communication |
| `.icon-btn-danger` | `#fef2f2` | `#ef4444` | Delete, destructive actions |

**Emoji is acceptable for:**
- Decorative indicators (apartment count badge: 🏠)
- Empty state illustrations (large, centered, 3rem)
- Category icons from data (stored in DB)

**Emoji is NOT acceptable for:**
- Action buttons (use SVG icon-btn instead)
- Navigation controls

## Page Actions Bar (Sub-Topbar)

Every page (except Home) has a `.page-actions-bar` below the global topbar:

```jsx
<div className="page-actions-bar">
  <Link to="/" className="back-link">→ חזרה</Link>
  <span className="page-actions-title">שם העמוד</span>
  {/* action buttons on the left (marginRight: auto) */}
</div>
```

Rules:
- Always include a bold page title using `.page-actions-title` (700 weight, 1rem)
- Back link on the right (RTL), action buttons on the left (`marginRight: auto`)
- Use icon-btn elements for actions, not emoji or full-width buttons
- Page-level actions (add new, camera, etc.) belong here — not as big buttons in the content area

## Buttons

| Class | Style | Use case |
|-------|-------|----------|
| `.btn` | Base: inline-flex, gap 6px, padding 10px 18px, radius 8px | All buttons |
| `.btn-primary` | Blue bg, white text | Primary CTA |
| `.btn-secondary` | White bg, border | Secondary actions |
| `.btn-danger` | Red bg, white text | Destructive inline |
| `.btn-full` | 100% width, centered | Form submits |
| `.icon-btn` | 40×40 circle, no border | Icon-only actions |

## Cards

- Background: `var(--card-bg)`
- Border: `1px solid var(--border)`
- Radius: `var(--radius)` (12px)
- Padding: 16px
- Shadow: `var(--shadow)` — subtle elevation
- Hover: `var(--shadow-md)` for interactive cards

## Form Fields

- Font size: 16px (prevents iOS zoom)
- Padding: 10px 12px
- Border radius: 8px
- Border: 1px solid `var(--border)`
- Focus: 2px primary ring, no outline

## Transitions

All interactive elements: `transition: [property] 0.2s ease`

## Empty States

Centered layout with:
- Large emoji (3rem)
- Secondary-colored message text
- Optional action button below
