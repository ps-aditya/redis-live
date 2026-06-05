---
name: RSE Dark Systems
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9cbb9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849585'
  outline-variant: '#3b4b3d'
  surface-tint: '#00e479'
  primary: '#f1ffef'
  on-primary: '#003919'
  primary-container: '#00ff88'
  on-primary-container: '#007139'
  inverse-primary: '#006d37'
  secondary: '#ffdb9d'
  on-secondary: '#412d00'
  secondary-container: '#feb700'
  on-secondary-container: '#6b4b00'
  tertiary: '#fffaf9'
  on-tertiary: '#680008'
  tertiary-container: '#ffd5d1'
  on-tertiary-container: '#c6031a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#60ff99'
  primary-fixed-dim: '#00e479'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005228'
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#ffba20'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#410003'
  on-tertiary-fixed-variant: '#930010'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  bg-panel: '#111111'
  bg-surface: '#181818'
  bg-elevated: '#1E1E1E'
  border-default: '#2A2A2A'
  border-accent: '#3A3A3A'
  text-primary: '#F0F0F0'
  text-secondary: '#888888'
  text-muted: '#555555'
  text-terminal: '#A8FF78'
  accent-info: '#4DA6FF'
typography:
  headline-xl:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-default:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  mono-data-lg:
    fontFamily: JetBrains Mono
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  mono-data-sm:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base-unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  nav-height: 56px
  utility-height: 48px
---

## Brand & Style

The design system is built for the **Redis State Explorer (RSE)**, a high-performance environment for database engineers and architects. The brand personality is **surgical, technical, and low-level**, designed to feel like a sophisticated fusion of a terminal emulator and a memory profiler. It prioritizes the "Observer" role—enabling users to monitor, dissect, and understand data state with clinical precision.

The design style is **Minimalist / Systems-Brutalist**. It rejects decorative elements like gradients or soft shadows in favor of high-contrast functional signaling. The interface utilizes raw, layered surfaces to communicate hierarchy, ensuring that the primary focus remains on the data density and real-time state mutations. 

**Core Principles:**
- **Surgical Precision:** Every pixel serves an informational purpose.
- **Zero Ambiguity:** Use functional color to signal state changes (mutations, TTL, errors) exclusively.
- **Monospaced-First:** Data is the hero; treat every key and value with the mechanical reverence of code.

## Colors

This design system utilizes a strictly dark, high-contrast palette. Backgrounds are tiered through subtle value shifts to create "nested" depth without relying on shadows.

- **Functional Signaling:** 
  - **Primary (#00FF88):** Success, active actions, and "New" data states.
  - **Secondary (#FFB800):** Warnings, near-expiry TTL (≤ 60s), and "Changed" data states.
  - **Tertiary (#FF3B3B):** Critical errors, destructive actions (Nuke DB), and "Deleted" data states.
  - **Info (#4DA6FF):** Meta-information, tags, and specific data type indicators.

- **Color Application:**
  - **Data Flashes:** When data mutations occur, the element's border or background should pulse with the corresponding functional color to provide immediate temporal feedback.
  - **Terminal Output:** Use the specific `#A8FF78` (Terminal Green) for command-line responses to differentiate between UI labels and engine output.

## Typography

The system employs a dual-typeface strategy to separate the **User Interface** from the **Data Layer**.

1.  **IBM Plex Sans (UI):** Used for all navigation, headers, labels, and descriptive body text. It provides a technical but readable structure to the application frame.
2.  **JetBrains Mono (Data):** Used for all Redis keys, values, terminal commands, and execution traces. This ensures that data is always presented in a fixed-width grid, aiding in the visual comparison of hashes and lists.

**Hierarchy Rules:**
- All labels for data types (e.g., `STRING`, `HASH`) should use `label-caps` for high scannability.
- Code blocks and terminal lines must never use the UI font; they are strictly reserved for `mono-data` roles.

## Layout & Spacing

The layout is governed by a strict 4px/8px incremental grid, emphasizing information density and logical grouping.

**Grid Systems:**
- **Dashboard/Lab:** A 3-column layout (25% Sidebar / 50% Main Visualizer / 25% Inspector).
- **Landing:** A symmetrical 3-column feature grid.
- **Tables:** Fixed row heights of 40px to maintain a rhythmic vertical scan.

**Adaptability:**
- **Desktop:** Full 3-column visibility for simultaneous data exploration and terminal usage.
- **Tablet:** The Inspector panel (Right) collapses into an overlay or bottom sheet.
- **Mobile:** Single column focus. Margins reduce to 16px. The `ExecutionTrace` pipeline switches to a horizontal scroll or vertical stack.

## Elevation & Depth

This system avoids ambient shadows in favor of **Tonal Layering**. Depth is communicated through the lightness of the surface colors and sharp borders.

- **Level 0 (Base):** `#0D0D0D` — The canvas and primary page background.
- **Level 1 (Panels):** `#111111` — Major UI sections like Sidebars or Table containers.
- **Level 2 (Surfaces):** `#181818` — Input fields, secondary containers, or alternating table rows.
- **Level 3 (Interactive):** `#1E1E1E` — Hover states and active row selections.

**Borders:**
Use 1px borders in `--color-border` (#2A2A2A) to define shapes. For focus states or active selections, use a high-contrast 2px solid border in `--color-accent-primary`.

## Shapes

The shape language is primarily **Soft (0.25rem)** to maintain a technical feel without being overly aggressive. 

- **Components:** Buttons, Input fields, and List nodes use `4px` (sm) rounding.
- **Containers:** Feature cards and main panels use `8px` (md) rounding.
- **Badges:** Type badges (e.g., "STRING") use a pill shape (minimal radius or 3px) to distinguish them from interactive buttons.
- **Data Nodes:** Set members or individual list elements use a full `99px` TagPill shape to represent discrete data units.

## Components

**Buttons:**
- **Primary:** Background `#00FF88`, Text `#000000`, no rounding or 4px.
- **Secondary:** Transparent background, 1px border `#3A3A3A`, Text `#F0F0F0`.
- **Danger (Nuke):** Transparent background, 1px border `#FF3B3B`, Text `#FF3B3B`. On hover, apply a 10% opacity `#FF3B3B` fill.

**Input Fields:**
- Background `#181818`, 1px border `#2A2A2A`.
- Prefix/Suffix (e.g., the `>` in a terminal) should use `text-muted`.
- Focus state: `2px solid #00FF88` with an `outline-offset: 2px`.

**Data Cards & Visualizers:**
- **List Nodes:** Rectangular with `4px` rounding, connected by stroke-only arrows.
- **TTL Progress Bars:** Continuous smooth width animation. Use `#FFB800` when the value is below 60s.
- **Type Badges:** High-contrast background (15% opacity of the accent color) with bold `label-caps` text.

**Tables:**
- Alternating row colors (`#111111` and `#181818`).
- Selected row: `border-left: 2px solid #00FF88` and background `#1E1E1E`.

**Terminal Emulator:**
- Strictly black background (`#000000`).
- Text uses `mono-data-lg` in `#A8FF78`.
- No scrollbars; use a "clean" overflow or custom thin-track scrollbar to match the minimalist aesthetic.