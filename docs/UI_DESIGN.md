# AI Multi-Studio — UI Design System

**Last Updated:** 2026-04-04
**Scope:** Dark-mode glassmorphism design system for all UI components

Cross-references: [TECH_STACK.md](./TECH_STACK.md) · [MODULE_STRUCTURE.md](./MODULE_STRUCTURE.md) · [REQUIREMENTS.md](./REQUIREMENTS.md)

---

## 1. Design Philosophy

**Theme:** Dark-mode glassmorphism — depth through translucency, not flat colour.

**Three design rules:**
1. **Depth over flatness** — every surface sits on a layer. Base → Surface → Elevated → Overlay. Shadows and backdrop blurs make layers legible without hard borders.
2. **Gradient as brand** — the violet-blue-cyan gradient is the brand's single accent system. It appears on primary actions, active states, loading rings, and progress indicators. Never use it for body text or decorative borders.
3. **Motion signals intent** — animation is reserved for state changes (loading, success, error) and hover feedback. Idle screens are static.

**Audience context:** Content creators running the app on desktop browsers and mobile. Priority breakpoints per NFR-05: dashboard, preview page, new project page.

---

## 2. Color Palette

### 2.1 Background Layers

| Token name | Hex | Tailwind custom class | Usage |
|---|---|---|---|
| `bg-base` | `#080D1A` | `bg-base` | App shell, `<html>` background |
| `bg-surface` | `#0F1629` | `bg-surface` | Cards, panels, sidebar |
| `bg-elevated` | `#161F35` | `bg-elevated` | Dropdowns, modals, tooltips |
| `bg-overlay` | `#1E2A47` | `bg-overlay` | Active menu items, selected rows |

### 2.2 Brand Gradient

```
from-violet-600 via-blue-600 to-cyan-500
```

Direction variants:
- **Horizontal (default):** `bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500`
- **Diagonal (hero sections):** `bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500`
- **Text gradient:** `bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent`

### 2.3 Glass Values

| Property | Value | Tailwind utility |
|---|---|---|
| Glass background | `rgba(255,255,255,0.05)` | `bg-white/5` |
| Glass border | `rgba(255,255,255,0.08)` | `border-white/[0.08]` |
| Glass hover background | `rgba(255,255,255,0.08)` | `hover:bg-white/[0.08]` |
| Backdrop blur | `blur(24px)` | `backdrop-blur-xl` |
| Deep shadow | `0 8px 32px rgba(0,0,0,0.4)` | `shadow-[0_8px_32px_rgba(0,0,0,0.4)]` |
| Glow shadow | `0 0 40px rgba(139,92,246,0.15)` | `shadow-[0_0_40px_rgba(139,92,246,0.15)]` |

### 2.4 Semantic Colors

| Role | Color | Tailwind class | Usage |
|---|---|---|---|
| Success | Emerald 500 | `text-emerald-500` / `bg-emerald-500/10` | `done` status, checkmarks |
| Warning | Amber 400 | `text-amber-400` / `bg-amber-400/10` | `processing` status |
| Error | Red 500 | `text-red-500` / `bg-red-500/10` | `failed` status, form errors |
| Info | Slate 400 | `text-slate-400` | Secondary labels, metadata |
| Muted | Slate 500 | `text-slate-500` | Placeholder text, disabled states |
| Primary text | White | `text-white` | Headings, primary content |
| Body text | Slate 300 | `text-slate-300` | Body copy, descriptions |

### 2.5 Status Badge Colors

| Status | Background | Text | Border |
|---|---|---|---|
| `pending` | `bg-amber-400/10` | `text-amber-400` | `border-amber-400/20` |
| `processing` | `bg-blue-500/10` | `text-blue-400` | `border-blue-500/20` |
| `done` | `bg-emerald-500/10` | `text-emerald-400` | `border-emerald-500/20` |
| `failed` | `bg-red-500/10` | `text-red-400` | `border-red-500/20` |

---

## 3. Typography

### 3.1 Font Stack

**Primary (use first):** Geist — already available in the project via `next/font/local` (Next.js 14 default). Zero layout shift, no external request.

**Fallback chain:**
```css
font-family: 'Geist', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

**Monospace (code blocks, word counts):**
```css
font-family: 'Geist Mono', 'JetBrains Mono', ui-monospace, 'Cascadia Code', monospace;
```

### 3.2 Type Scale (8 tokens)

| Token | Size | Line height | Weight | Usage |
|---|---|---|---|---|
| `text-display` | `3rem` (48px) | `1.1` | `800` | Landing page hero only |
| `text-heading-1` | `1.875rem` (30px) | `1.25` | `700` | Page titles |
| `text-heading-2` | `1.5rem` (24px) | `1.3` | `600` | Section headings, card titles |
| `text-heading-3` | `1.25rem` (20px) | `1.4` | `600` | Sub-section labels |
| `text-body-lg` | `1rem` (16px) | `1.6` | `400` | Primary body text |
| `text-body` | `0.875rem` (14px) | `1.6` | `400` | Secondary body, descriptions |
| `text-small` | `0.8125rem` (13px) | `1.5` | `400` | Labels, metadata |
| `text-xs` | `0.75rem` (12px) | `1.4` | `500` | Badges, tags, status chips |

### 3.3 Typography Rules

- **Never use pure white (`#FFFFFF`) for body text** — use `text-slate-300` to reduce eye strain on dark backgrounds.
- **Headings only get `text-white`** (`text-white` = `#FFFFFF`).
- **Gradient text** is reserved for brand moments: hero headline, empty-state CTAs. Do not apply to interactive elements.
- **Character/word count badges** use `font-mono text-xs text-slate-400`.

---

## 4. Component Specifications

### 4.1 GlassCard

**File:** `src/components/ui/GlassCard.tsx`

Base className:
```
bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]
```

Variants:

| Variant | Additional classes | Usage |
|---|---|---|
| Default | *(base only)* | Dashboard project cards |
| Hoverable | `hover:bg-white/[0.08] hover:border-white/[0.12] hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] transition-all duration-200 cursor-pointer` | Clickable project cards |
| Active/Selected | `bg-white/[0.08] border-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.2)]` | Selected channel tab, active nav item |
| Inset | `bg-black/20 border-white/[0.05] rounded-xl` | Nested panels within a card |

Props interface:
```typescript
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hoverable' | 'active' | 'inset';
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg'; // p-4 | p-6 | p-8
}
```

### 4.2 GradientButton

**File:** `src/components/ui/GradientButton.tsx`

Base className:
```
bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-white font-semibold rounded-xl transition-all duration-200
```

Size variants:

| Size | Classes | Usage |
|---|---|---|
| `sm` | `px-4 py-2 text-sm` | Inline actions (Copy, Schedule) |
| `md` (default) | `px-6 py-3 text-sm` | Form submits, card actions |
| `lg` | `px-8 py-4 text-base` | Primary page CTAs |

State classes:

| State | Additional classes |
|---|---|
| Hover | `hover:opacity-90 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.02]` |
| Active | `active:scale-[0.98]` |
| Disabled | `opacity-40 cursor-not-allowed pointer-events-none` |
| Loading | `opacity-70 cursor-wait` (render spinner inside, keep text) |

### 4.3 Status Badges

**File:** `src/components/ui/StatusBadge.tsx`

className template:
```
inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
```

Apply status-specific colors from Section 2.5.

Dot indicator: `<span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />` — only on `processing` status.

### 4.4 Input Fields

Base className:
```
w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-500
focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
transition-all duration-150
```

Textarea (source content input):
```
w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-500
focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
transition-all duration-150 resize-none min-h-[160px]
```

Error state: append `border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50`

### 4.5 Source Type Selector (SourceTypeSelector.tsx)

Three buttons arranged in a horizontal group (`flex gap-2` on desktop, `grid grid-cols-3 gap-2` on mobile):

Inactive button:
```
flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08]
bg-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all duration-150 text-sm font-medium
```

Active button:
```
flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-violet-500/50
bg-violet-500/10 text-violet-300 text-sm font-medium
```

### 4.6 Channel Tabs (ChannelTabs.tsx)

Tab container: `flex gap-1 p-1 bg-white/5 rounded-xl border border-white/[0.08]`

Inactive tab: `flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all duration-150`

Active tab: `flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.08] text-white`

Platform colour accents (text on active tab only):
- Facebook: `text-blue-400`
- TikTok: `text-pink-400`
- Instagram: `text-purple-400`

### 4.7 Sidebar (Sidebar.tsx)

Dimensions:
- **Expanded:** `w-60` (240px)
- **Collapsed:** `w-16` (64px)
- **Transition:** `transition-all duration-300 ease-in-out`

Background: `bg-surface border-r border-white/[0.06]`

Nav item (inactive):
```
flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05]
transition-all duration-150 text-sm font-medium
```

Nav item (active):
```
flex items-center gap-3 px-3 py-2.5 rounded-xl text-white bg-white/[0.08] border border-white/[0.06]
text-sm font-medium
```

Logo gradient text: `text-xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent`

### 4.8 Audio Upload Drop Zone (AudioUpload.tsx)

Idle state:
```
border-2 border-dashed border-white/[0.12] rounded-2xl p-10 flex flex-col items-center justify-center gap-3
bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/40 transition-all duration-200 cursor-pointer
```

Drag-over state (add via `dragover` class):
```
border-violet-500/60 bg-violet-500/5 shadow-[0_0_30px_rgba(139,92,246,0.15)]
```

Error state (file too large, wrong type):
```
border-red-500/40 bg-red-500/5
```

### 4.9 Processing Step Indicator

Used on `/dashboard/projects/[id]/processing/page.tsx`.

Four steps: "Analysing content" → "Drafting Facebook post" → "Drafting TikTok script" → "Drafting Instagram carousel"

Step states:

| State | Visual |
|---|---|
| Completed | Emerald ring + checkmark icon, `text-emerald-400` label |
| Active | Violet pulsing ring (`animate-[spin_1.5s_linear_infinite]`), `text-white` label |
| Pending | `bg-white/5 border border-white/[0.08]` neutral ring, `text-slate-500` label |

Active ring className:
```
w-12 h-12 rounded-full border-2 border-t-violet-500 border-r-blue-500 border-b-cyan-500 border-l-transparent
animate-[spin_1.5s_linear_infinite]
```

Step container layout: `flex flex-col items-center gap-8` (vertical stack) on all screen sizes.

### 4.10 Stats Cards (Dashboard)

Container: `grid grid-cols-2 lg:grid-cols-4 gap-4`

Each card uses `GlassCard` with `padding="md"` and:
```
flex flex-col gap-1
```

Number: `text-3xl font-bold text-white`
Label: `text-sm text-slate-400`
Icon: `text-violet-400` (top-right corner, `ml-auto`)

---

## 5. Layout & Spacing

### 5.1 App Shell

```
html: bg-base min-h-screen
body: flex
sidebar: fixed | sticky, full height (100vh), z-40
main content: flex-1, ml-60 (desktop) → ml-0 (mobile with overlay sidebar)
```

### 5.2 Content Container

Max-width wrapper applied inside every page's root div:
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8
```

### 5.3 Dashboard Grid

Project card grid:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
```

Stats row (above grid):
```
grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8
```

### 5.4 Spacing Scale (use only these values)

| Token | Value | Usage |
|---|---|---|
| `gap-1` / `p-1` | 4px | Icon-to-text tight groupings |
| `gap-2` / `p-2` | 8px | Badge internals, tab padding |
| `gap-3` / `p-3` | 12px | Nav item internals |
| `gap-4` / `p-4` | 16px | Card small padding, grid gap |
| `gap-6` / `p-6` | 24px | Card default padding |
| `gap-8` / `p-8` | 32px | Page section separation |
| `gap-12` / `py-12` | 48px | Hero section internal padding |

### 5.5 Border Radius

| Element | Radius |
|---|---|
| Large cards, panels | `rounded-2xl` (16px) |
| Buttons, inputs, tabs | `rounded-xl` (12px) |
| Small badges, chips | `rounded-full` |
| Nested inset panels | `rounded-xl` (12px) |

---

## 6. Dark Mode Decision

**Decision:** Dark-mode only. No light-mode variant.

**Rationale:**
- Content creators often work in low-light environments during video editing sessions
- Glassmorphism effects require dark backgrounds — translucent `rgba(255,255,255,0.05)` surfaces are invisible on light backgrounds
- Eliminates dual-theme maintenance overhead in a 6-week timeline
- Internship scope does not include accessible contrast validation for both modes

**Tailwind config requirement:**
```typescript
// tailwind.config.ts
darkMode: 'class'
```

Apply `dark` class on `<html>` via layout.tsx:
```tsx
// src/app/layout.tsx
<html lang="en" className="dark">
```

Since the app is dark-only, `dark:` prefix classes are unnecessary — write light-mode classes directly. Reserve `dark:` prefix only if a component library (e.g., Radix UI) forces it.

---

## 7. Animation & Transitions

### 7.1 Transition Defaults

| Element type | Duration | Easing |
|---|---|---|
| Hover state changes | `150ms` | `ease-in-out` |
| Sidebar expand/collapse | `300ms` | `ease-in-out` |
| Modal/overlay enter | `200ms` | `ease-out` |
| Toast notifications (Sonner) | Sonner default | — |
| Page route transitions | None (instant) | — |

Always use `transition-all duration-[N]` shorthand. Do not list individual CSS properties.

### 7.2 Keyframe Animations (add to tailwind.config.ts)

```typescript
keyframes: {
  stepComplete: {
    '0%': { transform: 'scale(0.8)', opacity: '0' },
    '60%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)', opacity: '1' },
  },
  gradientShift: {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
  fadeInUp: {
    '0%': { opacity: '0', transform: 'translateY(16px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
},
animation: {
  stepComplete: 'stepComplete 0.4s ease-out forwards',
  gradientShift: 'gradientShift 4s ease infinite',
  fadeInUp: 'fadeInUp 0.3s ease-out forwards',
  shimmer: 'shimmer 1.5s infinite linear',
},
```

### 7.3 Skeleton Loading

Used on dashboard grid while project list loads:
```
bg-gradient-to-r from-white/5 via-white/[0.08] to-white/5 bg-[length:200%_100%] animate-shimmer rounded-2xl
```

Apply same height as the card it replaces (`h-48`).

### 7.4 Page Entry Animation

Wrap every page's root element:
```
<div className="animate-fadeInUp">
```

This is a 300ms fade-in-up on route change. Applies once; does not loop.

---

## 8. Tailwind Configuration

Full `tailwind.config.ts` block — drop this into the project root:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#080D1A',
        surface: '#0F1629',
        elevated: '#161F35',
        overlay: '#1E2A47',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #7C3AED, #2563EB, #06B6D4)',
        'brand-gradient-diagonal': 'linear-gradient(to bottom right, #7C3AED, #2563EB, #06B6D4)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
        glow: '0 0 40px rgba(139, 92, 246, 0.15)',
        'glow-strong': '0 0 40px rgba(139, 92, 246, 0.3)',
        'glow-button': '0 0 30px rgba(139, 92, 246, 0.4)',
      },
      backdropBlur: {
        glass: '24px',
      },
      borderRadius: {
        '2xl': '16px',
        xl: '12px',
      },
      keyframes: {
        stepComplete: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        stepComplete: 'stepComplete 0.4s ease-out forwards',
        gradientShift: 'gradientShift 4s ease infinite',
        fadeInUp: 'fadeInUp 0.3s ease-out forwards',
        shimmer: 'shimmer 1.5s infinite linear',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 9. CSS Variables

Add to `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Background layers */
  --color-base: #080D1A;
  --color-surface: #0F1629;
  --color-elevated: #161F35;
  --color-overlay: #1E2A47;

  /* Brand gradient stops */
  --color-brand-violet: #7C3AED;
  --color-brand-blue: #2563EB;
  --color-brand-cyan: #06B6D4;

  /* Semantic */
  --color-success: #10B981;  /* emerald-500 */
  --color-warning: #FBBF24;  /* amber-400 */
  --color-error: #EF4444;    /* red-500 */
  --color-info: #94A3B8;     /* slate-400 */
  --color-muted: #64748B;    /* slate-500 */

  /* Glass surfaces */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-bg-hover: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.12);
  --glass-blur: 24px;
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Typography */
  --font-sans: 'Geist', 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;

  /* Spacing */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --content-max-width: 1280px;
  --topbar-height: 64px;
}

html {
  background-color: var(--color-base);
  color-scheme: dark;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-base);
  color: #CBD5E1; /* slate-300 */
  min-height: 100vh;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Selection */
::selection {
  background: rgba(139, 92, 246, 0.3);
  color: white;
}
```

---

## 10. Component Starters

Copy-paste ready className strings and component shells.

### GlassCard.tsx

```tsx
// src/components/ui/GlassCard.tsx
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'hoverable' | 'active' | 'inset'
  padding?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

const variantMap = {
  default: '',
  hoverable:
    'hover:bg-white/[0.08] hover:border-white/[0.12] hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] cursor-pointer',
  active:
    'bg-white/[0.08] border-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.2)]',
  inset:
    'bg-black/20 border-white/[0.05] rounded-xl shadow-none backdrop-blur-none',
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  padding = 'md',
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-200',
        paddingMap[padding],
        variantMap[variant],
        className,
      )}
    >
      {children}
    </div>
  )
}
```

### GradientButton.tsx

```tsx
// src/components/ui/GradientButton.tsx
import { cn } from '@/lib/utils'

interface GradientButtonProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

const sizeMap = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' }

export function GradientButton({
  children,
  className,
  size = 'md',
  disabled,
  loading,
  onClick,
  type = 'button',
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 text-white font-semibold rounded-xl',
        'transition-all duration-200',
        'hover:opacity-90 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.02]',
        'active:scale-[0.98]',
        (disabled || loading) && 'opacity-40 cursor-not-allowed pointer-events-none',
        sizeMap[size],
        className,
      )}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
```

### StatusBadge.tsx

```tsx
// src/components/ui/StatusBadge.tsx
import { cn } from '@/lib/utils'

type Status = 'pending' | 'processing' | 'done' | 'failed'

const statusConfig: Record<Status, { bg: string; text: string; border: string; label: string }> = {
  pending:    { bg: 'bg-amber-400/10',   text: 'text-amber-400',   border: 'border-amber-400/20',   label: 'Pending' },
  processing: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    label: 'Processing' },
  done:       { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Done' },
  failed:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     label: 'Failed' },
}

export function StatusBadge({ status }: { status: Status }) {
  const { bg, text, border, label } = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        bg, text, border,
      )}
    >
      {status === 'processing' && (
        <span className={cn('w-1.5 h-1.5 rounded-full bg-current animate-pulse')} />
      )}
      {label}
    </span>
  )
}
```

---

## Design Token Summary

| Category | Count |
|---|---|
| Background layer colors | 4 |
| Glass surface values | 6 |
| Semantic colors | 7 |
| Status badge states | 4 |
| Typography scale tokens | 8 |
| Spacing scale tokens | 7 |
| Shadow tokens | 4 |
| Animation keyframes | 4 |
| Tailwind config extensions | 6 groups (colors, backgroundImage, boxShadow, keyframes, animation, fontFamily) |
| CSS custom properties (`:root`) | 20 |
| **Total design tokens defined** | **74** |

## Components Specified

| Component | File | Section |
|---|---|---|
| GlassCard | `src/components/ui/GlassCard.tsx` | 4.1, 10 |
| GradientButton | `src/components/ui/GradientButton.tsx` | 4.2, 10 |
| StatusBadge | `src/components/ui/StatusBadge.tsx` | 4.3, 10 |
| Input fields | inline | 4.4 |
| SourceTypeSelector | `src/components/input/SourceTypeSelector.tsx` | 4.5 |
| ChannelTabs | `src/components/preview/ChannelTabs.tsx` | 4.6 |
| Sidebar | `src/components/layout/Sidebar.tsx` | 4.7 |
| AudioUpload drop zone | `src/components/input/AudioUpload.tsx` | 4.8 |
| Processing step indicator | `src/app/dashboard/projects/[id]/processing/page.tsx` | 4.9 |
| Stats Cards | `src/app/dashboard/page.tsx` | 4.10 |
| **Total components specified** | **10** | |

## UI Audit Gap Confirmation

| # | MISSING item from audit | Resolved in UI_DESIGN.md |
|---|---|---|
| 1 | No color system defined | Section 2 — full palette with hex, Tailwind, usage |
| 2 | No glass surface values documented | Section 2.3 — 6 glass tokens |
| 3 | No typography scale | Section 3 — 8-token type scale |
| 4 | No font stack decision | Section 3.1 — Geist primary, Inter fallback |
| 5 | GlassCard className not documented | Section 4.1 + Section 10 starter |
| 6 | GradientButton variants not documented | Section 4.2 + Section 10 starter |
| 7 | No status badge spec | Section 4.3 + Section 10 starter |
| 8 | No sidebar dimension/collapse spec | Section 4.7 |
| 9 | No animation/keyframe definitions | Section 7 — 4 keyframes + Tailwind config |
| 10 | No CSS custom properties block | Section 9 — 20 CSS variables |

**Confirms: all 10 MISSING items from the UI audit are resolved.**
