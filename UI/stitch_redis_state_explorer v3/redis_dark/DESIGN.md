---
name: Redis Dark
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e6bdbc'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#ac8888'
  outline-variant: '#5c3f3f'
  surface-tint: '#ffb3b3'
  primary: '#ffb3b3'
  on-primary: '#680015'
  primary-container: '#dc143c'
  on-primary-container: '#fff1f0'
  inverse-primary: '#bf0030'
  secondary: '#95ccff'
  on-secondary: '#003352'
  secondary-container: '#00639a'
  on-secondary-container: '#badcff'
  tertiary: '#78d6d5'
  on-tertiary: '#003737'
  tertiary-container: '#007d7d'
  on-tertiary-container: '#c9fffe'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad9'
  primary-fixed-dim: '#ffb3b3'
  on-primary-fixed: '#40000a'
  on-primary-fixed-variant: '#920022'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#95ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004a75'
  tertiary-fixed: '#95f2f1'
  tertiary-fixed-dim: '#78d6d5'
  on-tertiary-fixed: '#002020'
  on-tertiary-fixed-variant: '#004f4f'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  unit: 4px
  container-margin: 16px
  gutter: 1px
  panel-padding: 12px
  stack-gap: 8px
---

## Brand & Style

This design system draws direct inspiration from professional Integrated Development Environments (IDEs), specifically tailored for power users, developers, and data engineers. The aesthetic is defined by high-performance utility, precision, and a "dark-first" philosophy that reduces eye strain during long-winded technical sessions.

The design style is **Corporate Modern with a Developer-Centric edge**. It utilizes a structured, panel-based layout with sharp geometric precision. Visual interest is driven by semantic syntax highlighting rather than decorative imagery. The interface should feel like a high-precision tool: responsive, low-latency, and information-dense.

## Colors

The palette is optimized for a technical environment. The background stack uses deep charcoals to create clear hierarchical separation without relying on heavy drop shadows. 

- **The Brand Core**: Redis Crimson (#DC143C) is used sparingly as a high-intent accent for primary actions, active states, and critical branding.
- **Semantic Highlighting**: We use a syntax-inspired system for data types. This allows users to scan complex data structures instantly.
- **Activity Areas**: The darkest shades are reserved for the "Activity Bar" and "Sidebar" areas to keep focus on the main "Editor" surface.
- **Hero Background**: Implement a faint repeating hexagonal grid or the primary brand mark pattern at 4-6% opacity to add depth to large empty states.

## Typography

This system uses a dual-font approach. **IBM Plex Sans** provides a technical yet readable grotesque for UI controls and headings, reflecting the systematic nature of the product. **JetBrains Mono** is utilized for all data values, keys, terminal outputs, and metadata labels to ensure character clarity (like distinguishing `0` from `O`).

- **Hierarchy**: Use `label-caps` for section headers and sidebar titles to create a clear "Workbench" feel.
- **Data Display**: All dynamic data retrieved from the database must use `code-md` or `code-sm`.
- **Mobile**: Scale `headline-lg` down to 24px on mobile devices.

## Layout & Spacing

The layout follows a **Fixed Panel Grid** model, mimicking the pane management of an IDE. Elements are separated by 1px borders (gutters) rather than wide margins to maximize information density.

- **Breakpoints**: 
  - Mobile (<768px): Single column, hidden sidebars behind hamburger menus.
  - Tablet (768px - 1200px): Fixed sidebar (240px), fluid main panel.
  - Desktop (>1200px): Multi-pane layout with persistent Activity Bar (48px) and flexible Sidebars.
- **Alignment**: Use a 4px baseline grid. Components should use tight internal padding (8px or 12px) to maintain a professional, compact appearance.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Accent Borders** rather than shadows. 

- **Layer 1 (Base)**: `#1E1E1E` - The primary workspace/editor background.
- **Layer 2 (Panels)**: `#252526` - Sidebars and secondary navigation.
- **Layer 3 (Surface)**: `#2D2D30` - Hover states and header bars.
- **Layer 4 (Popovers)**: `#37373D` - Context menus and tooltips. These are the only elements allowed a subtle 8px blur shadow (black, 40% opacity).

**Glow Effects**: The brand logo and primary buttons may use a subtle crimson glow (`rgba(220,14,60,0.15)`) to signify active energy or the "Redis" engine running.

## Shapes

The design system uses a **Sharp (0px)** corner radius for all primary UI elements including panels, inputs, and buttons. This reinforces the "engineered" and professional feel. 

- **Exceptions**: Status indicators (dots) and specific toggle switches may use a 100% pill shape for immediate visual recognition as "controls" rather than "containers."

## Components

### Navigation & Bars
- **Activity Bar**: Located on the far left, using `--color-bg-activity`.
- **Active State**: The active navigation item must feature a 3px solid `--color-accent-primary` border on the left (or bottom for top-nav) to indicate focus.

### Buttons
- **Primary**: Background `--color-accent-primary` with white text. 
- **Hover**: Shift background to `--color-accent-primary-dim` and apply a subtle `--color-accent-primary-glow` shadow.
- **Ghost**: Transparent background, 1px border `--color-border-accent`, primary color text.

### Panel Headers
- Use `--color-bg-surface` background.
- Apply a **3px solid `--color-accent-primary` left border** to denote the active panel or section.

### Type Badges
Used for indicating data types in key listings. Background is always `--color-bg-elevated`. Text color follows these rules:
- **STRING**: `--color-accent-string` (Orange)
- **LIST**: `--color-accent-keyword` (Purple)
- **HASH**: `--color-accent-secondary` (Blue)
- **SET**: `--color-delta-new` (Teal)
- **ZSET**: `--color-accent-warn` (Yellow)

### Structure Blocks (Key Containers)
- Containers for individual data keys.
- **TTL Indicator**: If a key has a Time-To-Live, the left border changes to `--color-accent-warn`.
- **Expiring State**: If TTL <= 10s, the left border should pulse slowly between `--color-accent-warn` and `--color-accent-primary`.

### Input Fields
- Background: `--color-bg-base`, Border: 1px solid `--color-border`.
- Focus State: Border becomes `--color-accent-secondary` (IDE Blue) with no glow.