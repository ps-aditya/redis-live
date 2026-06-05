# Redis State Explorer (RSE) — Frontend Specification V2
> **Purpose:** Stitch-ready component schema for AI-assisted UI generation.
> Every section is written as explicit layout directives, named component primitives, and enumerated state behaviors so Stitch can resolve each element unambiguously.

---

## Global Design System

### Theme Tokens
```
--color-bg-base:        #0D0D0D   /* primary background */
--color-bg-panel:       #111111   /* card / panel fill */
--color-bg-surface:     #181818   /* nested surface */
--color-bg-elevated:    #1E1E1E   /* hover, active row */
--color-border:         #2A2A2A   /* default border */
--color-border-accent:  #3A3A3A   /* dividers, separators */

--color-text-primary:   #F0F0F0
--color-text-secondary: #888888
--color-text-muted:     #555555
--color-text-code:      #A8FF78   /* monospace terminal output */

--color-accent-primary: #00FF88   /* primary CTA, highlight */
--color-accent-danger:  #FF3B3B   /* destructive actions */
--color-accent-warn:    #FFB800   /* TTL / expiry warnings */
--color-accent-info:    #4DA6FF   /* metadata, tags */

--color-delta-new:      #00FF88   /* new key row flash */
--color-delta-changed:  #FFB800   /* mutated key row flash */
--color-delta-deleted:  #FF3B3B   /* deleted key row flash */

--font-mono:    "JetBrains Mono", "Fira Code", monospace
--font-ui:      "IBM Plex Sans", "Inter", sans-serif

--radius-sm:    4px
--radius-md:    8px
--border-width: 1px solid var(--color-border)
```

### Typography Scale
| Token         | Size  | Weight | Font       | Usage                  |
|---------------|-------|--------|------------|------------------------|
| `heading-xl`  | 48px  | 700    | `font-ui`  | Hero H1                |
| `heading-lg`  | 32px  | 700    | `font-ui`  | Section H2             |
| `heading-md`  | 20px  | 600    | `font-ui`  | Card/Panel H3          |
| `label-sm`    | 12px  | 500    | `font-ui`  | Column headers, labels |
| `body`        | 14px  | 400    | `font-ui`  | Body copy              |
| `mono-lg`     | 15px  | 400    | `font-mono`| Terminal output lines  |
| `mono-sm`     | 13px  | 400    | `font-mono`| Key names, values      |

### Global Interaction States
- **Hover:** `background → --color-bg-elevated`, `border-color → --color-border-accent`
- **Active/Selected:** `border-left: 2px solid --color-accent-primary`
- **Danger Hover:** `background → rgba(255,59,59,0.08)`, `border-color → --color-accent-danger`
- **Flash Mutation:** keyframe `border-color` pulse on `--color-delta-changed` for 800ms, then reset
- **Focus Ring:** `outline: 2px solid --color-accent-primary`, `outline-offset: 2px`

---

## Screen 1 — Landing Page

**Goal:** Communicate RSE's purpose in under 10 seconds. Establish the "systems lab, not a course" identity.

### Layout Scaffold
```
┌─────────────────────────────────────────────────────────┐
│  [NavBar — Sticky Top]                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              [Hero Section — Center Aligned]            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Feature Cards Grid — 3 columns, equal width]          │
├─────────────────────────────────────────────────────────┤
│  [Workflow Pipeline — Horizontal step indicator]        │
└─────────────────────────────────────────────────────────┘
```

---

### Component: `NavBar`
**Type:** Sticky horizontal bar, full-width, `z-index: 100`
**Height:** 56px
**Background:** `--color-bg-base` with `border-bottom: --border-width`

| Slot         | Element                        | Style / Notes                                     |
|--------------|--------------------------------|---------------------------------------------------|
| Left         | `[Logo]` text "RSE"            | `font-mono`, `heading-md`, `--color-accent-primary` |
| Right Group  | `[Link]` "Documentation"       | `body`, `--color-text-secondary`, underline on hover |
| Right Group  | `[Link]` "GitHub"              | Same as Documentation link                        |
| Right Group  | `[Button: Primary]` "Launch Lab" | `--color-accent-primary` bg, `#000` text, `radius-sm`, links to Screen 2 |

---

### Component: `HeroSection`
**Type:** Full-viewport-height section, vertically and horizontally centered content
**Max content width:** 720px

| Element                  | Content                                                                                             | Style Token         |
|--------------------------|-----------------------------------------------------------------------------------------------------|---------------------|
| `[Eyebrow Label]`        | `"OPEN SOURCE REDIS LAB"`                                                                           | `label-sm`, `--color-text-muted`, `letter-spacing: 0.12em` |
| `[H1 Heading]`           | `"Redis State Explorer"`                                                                            | `heading-xl`, `--color-text-primary` |
| `[Subtitle — Monospace]` | `"Observe Redis. Break Redis. Understand Redis."`                                                   | `mono-lg`, `--color-text-secondary` |
| `[Body Paragraph]`       | `"An open-source experimentation lab for exploring Redis through destructive interaction and real-time state visualization."` | `body`, `--color-text-secondary` |
| `[Button: Primary CTA]`  | `"Launch Lab"` → links to Screen 2                                                                  | Full-width up to 200px, `--color-accent-primary` bg |
| `[Button: Secondary CTA]`| `"View Documentation"` → external link                                                             | Outlined, `--color-border-accent` border, transparent bg |

**CTA Group layout:** Horizontal flex, `gap: 12px`, centered.

---

### Component: `FeatureCardsGrid`
**Section heading:** `"What Makes RSE Different"` — `heading-lg`, left-aligned above the grid
**Layout:** 3-column CSS grid, equal width, `gap: 16px`

Each `[FeatureCard]` contains:
- `[Icon Area]` — 32×32px monochrome icon placeholder (no color fill, stroke only)
- `[Card Title]` — `heading-md`, `--color-text-primary`
- `[Card Body]` — `body`, `--color-text-secondary`
- `border: --border-width`, `border-radius: --radius-md`, `padding: 24px`, `background: --color-bg-panel`

| Card # | Title                       | Body Copy                                                                                                          |
|--------|-----------------------------|--------------------------------------------------------------------------------------------------------------------|
| 1      | `"Break & Fix Laboratory"`  | `"Intentionally trigger out-of-memory errors, TTL expirations, and type mismatches. See exactly how Redis reacts."` |
| 2      | `"Real-Time State Delta"`   | `"Every command fires a visual diff across the keyspace. Watch rows flash when values mutate or expire."`           |
| 3      | `"Structural Visualizer"`   | `"Strings, Lists, Hashes, and Sets rendered as live memory-layout diagrams — not raw text lines."`                 |

---

### Component: `WorkflowPipeline`
**Type:** Horizontal step-indicator strip
**Background:** `--color-bg-surface`, full-width, `padding: 32px 0`, `border-top: --border-width`
**Heading:** `"How RSE Works"` — `label-sm`, `--color-text-muted`, centered above steps

Four steps connected by right-arrow separators (`→`):

| Step # | Label                     | Sublabel (mono, muted)          |
|--------|---------------------------|---------------------------------|
| 1      | `"Command Input"`         | `SET key value`                 |
| 2      | `"State Delta Highlight"` | `row flashes on mutation`       |
| 3      | `"Structural Visualization"` | `memory layout renders`      |
| 4      | `"Concept Mastery"`       | `cause → effect → understanding` |

Each step box: `border: --border-width`, `border-radius: --radius-sm`, `padding: 16px 20px`, `background: --color-bg-panel`
Active connector arrows: `--color-text-muted`, `font-mono`

---

## Screen 2 — Main Lab Interface

**Goal:** Core experimentation environment. Systems-tool feel. No tutorial chrome. Direct command access.

### Layout Scaffold
```
┌──────────────────────────────────────────────────────────────────┐
│  [TopUtilityBar — 48px height]                                   │
├────────────────┬─────────────────────────────┬───────────────────┤
│  Left Panel    │  Center Panel               │  Right Panel      │
│  25% width     │  50% width                  │  25% width        │
│                │                             │                   │
│  [Command      │  [Keyspace Table            │  [Key Inspector]  │
│   Console]     │   Explorer]                 │                   │
│                │                             │                   │
└────────────────┴─────────────────────────────┴───────────────────┘
```
**Overall layout:** `height: 100vh`, `overflow: hidden`. Each column: `height: 100%`, independent scrolling.

---

### Component: `TopUtilityBar`
**Height:** 48px, `background: --color-bg-panel`, `border-bottom: --border-width`

| Slot   | Element                          | Style / Notes                                              |
|--------|----------------------------------|------------------------------------------------------------|
| Left   | `[Label]` `"RSE Lab v1.0"`       | `mono-sm`, `--color-text-muted`                            |
| Center | `[Dropdown]` "Select Sandbox Profile" | Options: `Default / Empty` · `Populated: E-Commerce` · `Chaos / Heavy Load` |
| Right  | `[Button: Danger]` `"⚡ Nuke DB (FLUSHALL)"` | `--color-accent-danger` border, transparent bg, hover fills danger color at 10% opacity |

**Dropdown behavior:** Selecting a profile reloads the center keyspace table with seeded data. No confirmation dialog needed.

---

### Component: `CommandConsolePanel` (Left Column)
**Header:** `[PanelHeader]` — text `"Interactive Terminal"`, `heading-md`, `--color-bg-surface` background, `border-bottom: --border-width`, `padding: 12px 16px`

**Terminal Output Window:**
- `background: #000000`
- `font: mono-lg`, `color: --color-text-code`
- `padding: 12px`, `overflow-y: scroll`
- `height: calc(100% - 96px)` (fills below header and input)
- Each output line prefixed with `>` in `--color-text-muted`
- Error lines: `--color-accent-danger`
- Success confirmations (e.g., `OK`, integer reply): `--color-accent-primary`

**Terminal Line Input:**
- Fixed to bottom of panel
- Left-side prefix label: `127.0.0.1:6379>` in `--color-text-muted`, `mono-sm`
- `[Input Field]`: full remaining width, `background: #000`, `color: --color-text-primary`, `font: mono-lg`, no border radius, `border-top: --border-width`
- **On Enter:** appends submitted command and Redis response to output window; triggers data refresh in Center and Right panels

---

### Component: `KeyspaceExplorerPanel` (Center Column)
**Header:** `[PanelHeader]` — text `"Keyspace Explorer · DB 0"`, same style as left panel header

**Search/Filter Bar:**
- Full-width input below header
- Placeholder: `"Filter keys by pattern  (e.g., user:*)"`
- `background: --color-bg-surface`, `border-bottom: --border-width`, no border-radius
- `font: mono-sm`

**State Data Grid Table:**
- `width: 100%`, no outer border, `border-collapse: collapse`
- Row `height: 40px`, alternating `background: --color-bg-panel` / `--color-bg-surface`
- `border-bottom: 1px solid --color-bg-elevated` between rows

Column schema:

| Column          | Width  | Content                                     | Style                        |
|-----------------|--------|---------------------------------------------|------------------------------|
| `[Radio]`       | 32px   | Row selection radio input                   | Custom styled, accent color  |
| `Key Name`      | 35%    | Raw key string                              | `mono-sm`, `--color-text-primary` |
| `Value Preview` | 28%    | Truncated value (max 40 chars + `…`)        | `mono-sm`, `--color-text-secondary` |
| `Type`          | 12%    | Redis type badge                            | See Type Badge spec below    |
| `TTL Status`    | 15%    | Integer seconds or `"∞ Persistent"`         | See TTL Badge spec below     |

**Type Badge:** `[Pill]` — `border-radius: 3px`, `padding: 2px 6px`, `label-sm`, uppercase
- `STRING` → `--color-accent-info` bg at 15% opacity, `--color-accent-info` text
- `LIST` → amber tint
- `HASH` → purple tint
- `SET` → teal tint
- `ZSET` → orange tint

**TTL Badge:**
- `"∞ Persistent"` → `--color-text-muted`
- Integer `> 60` → `--color-accent-primary`
- Integer `≤ 60` → `--color-accent-warn` (countdown visible)
- `"EXPIRED"` → `--color-accent-danger`, row becomes 40% opacity

**Row State Behaviors:**
- **On row click:** sets that key as selected; Right panel inspector activates with that key's data
- **On value mutation (command executed):** row border pulses `--color-delta-changed` for 800ms
- **On key creation:** row slides in from top with border `--color-delta-new` for 800ms
- **On key deletion / expiry:** row `--color-delta-deleted` flash, then row fades out and removes

---

### Component: `KeyInspectorPanel` (Right Column)
**Header:** `[PanelHeader]` — text `"Key Inspector"`, same header style

**Empty State (no key selected):**
- Full-panel centered content
- `[Icon]` — lock/key outline, 40px, `--color-text-muted`
- `[Text]` — `"Select a key from the keyspace to inspect its metadata."` — `body`, `--color-text-muted`

**Populated State (key selected):** `[MetadataSheet]`

| Field Label                 | Value Type / Format                               | Style                              |
|-----------------------------|---------------------------------------------------|------------------------------------|
| `Key Name`                  | Raw string                                        | `mono-sm`, `--color-text-primary`  |
| `Data Type`                 | Redis type (matches grid badge)                   | Type badge component               |
| `Time To Live (TTL)`        | Integer countdown `"Expires in 42s"` or `"Persistent (No TTL)"` | Countdown in `--color-accent-warn` if ≤ 60s |
| `Memory Estimate`           | Simulated byte size `"~56 bytes"`                 | `mono-sm`, `--color-text-secondary` |
| `Encoding`                  | e.g., `"embstr"`, `"listpack"`, `"ziplist"`       | `mono-sm`, `--color-text-muted`    |

Each field row: `[Label]` left, `[Value]` right, `border-bottom: 1px solid --color-bg-elevated`, `padding: 12px 16px`

**Action Buttons (below metadata):**
- `[Button: Secondary]` `"Copy Key Name"`
- `[Button: Danger Outline]` `"Delete Key (DEL)"`

---

## Screen 3 — Guided "Break & Learn" Experiment View

**Goal:** Guide discovery without handing answers. The left panel briefs; the right workspace is for hands-on destruction.

### Layout Scaffold
```
┌────────────────────────────────────────────────────────────────────┐
│  [ExperimentTopBar — 48px]                                         │
├──────────────────────────┬─────────────────────────────────────────┤
│  Left Panel — 30%        │  Right Work Area — 70%                  │
│                          │                                         │
│  [ExperimentBriefing]    │  [LabTerminal — top half]               │
│                          ├─────────────────────────────────────────┤
│                          │  [StructuralVisualizer — bottom half]   │
└──────────────────────────┴─────────────────────────────────────────┘
```

---

### Component: `ExperimentTopBar`
- `[ProgressLabel]` — `"Module 02 of 06"` — `label-sm`, `--color-text-muted`
- `[ModuleTitle]` — `"Simulating Queues with Lists"` — `heading-md`, `--color-text-primary`
- `[Button: Ghost]` `"← Back to Modules"` — left slot
- `[ProgressBar]` — thin strip at very bottom of bar, `33%` fill, `--color-accent-primary`

---

### Component: `ExperimentBriefingPanel` (Left Panel)
**Background:** `--color-bg-panel`, `border-right: --border-width`

**Section: Objective Block**
- `[Label]` `"THE GOAL"` — `label-sm`, `--color-text-muted`, `letter-spacing: 0.1em`
- `[Body Text]` — experiment description. Example: `"Use Redis List commands to build a strict FIFO queue. Then deliberately break it by polluting the sequential structure with a mis-targeted write."`

**Section: Hints Accordion**
- `[AccordionItem 1]` — collapsed by default
  - Header: `"Useful Commands"`
  - Content: code tokens `LPUSH` · `RPOP` · `LRANGE` · `LLEN` — each in `[CodePill]` (`mono-sm`, `--color-bg-surface`, `--color-accent-info` text)
- `[AccordionItem 2]` — collapsed by default
  - Header: `"How to Break It"`
  - Content: `"Try LSET to insert into the middle, or LPOP to drain from the wrong side and observe how FIFO ordering breaks."`

**Section: Verification Checklist Block**
- `[StatusBadge]` — `"CRITERIA UNMET"` (red) or `"CRITERIA MET"` (green) based on state
- `[ChecklistItem 1]` — checkbox (unchecked by default): `"List task_queue contains exactly 3 items"`
- `[ChecklistItem 2]` — checkbox (unchecked by default): `"RPOP from task_queue returns the first-inserted item"`
- `[ChecklistItem 3]` — checkbox (unchecked by default): `"Deliberately caused FIFO ordering to break"`
- Checklist items auto-check when terminal commands satisfy the condition

---

### Component: `LabTerminal` (Right Panel — Top Half)
Reuses `CommandConsolePanel` from Screen 2. Scoped to the active experiment's key namespace. Same terminal output + monospace input behavior.

---

### Component: `StructuralVisualizerEmbed` (Right Panel — Bottom Half)
Reuses `StructuralVisualizerCanvas` from Screen 4. Renders live data structures for keys referenced in the active experiment. Scrollable if content overflows.

---

## Screen 4 — Real-Time Structural Visualizer

**Goal:** Transform every Redis command into an observable cause-and-effect diagram. This is RSE's core differentiator.

### Layout Scaffold
```
┌──────────────────────────────────────────────────────┐
│  [ExecutionTracePipeline — top panel, fixed height]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [StructuralVisualizerCanvas — scrollable]           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

### Component: `ExecutionTracePipeline`
**Height:** 96px, `background: --color-bg-surface`, `border-bottom: --border-width`
**Layout:** 4 step boxes in a horizontal row, connected by `→` separators, centered vertically

| Step Box          | Label                        | Dynamic Content Example                         |
|-------------------|------------------------------|--------------------------------------------------|
| Step 1            | `INPUT`                      | `LPUSH task_queue "Job_A"` — mono, accent color  |
| Step 2            | `INTERPRETATION`             | `"Prepends item to head of list 'task_queue'"` — body |
| Step 3            | `MUTATION DELTA`             | `"Key Type: LIST · Elements: +1 · Total: 3"` — mono |
| Step 4            | `VISUALIZATION`              | `"Structure updated ↓"` with arrow pointing down |

Each step box: `border: --border-width`, `radius-sm`, `padding: 12px 16px`, `background: --color-bg-panel`, `min-width: 180px`
Step labels (`INPUT`, `INTERPRETATION`…): `label-sm`, `--color-text-muted`, positioned above content

---

### Component: `StructuralVisualizerCanvas`
**Background:** `--color-bg-base`, scrollable, `padding: 32px`
Renders data structure diagrams for each key currently in scope. Each structure is an isolated `[StructureBlock]` with:
- `[KeyLabel]` — `"key_name"` in `mono-sm`, `--color-accent-primary`, positioned top-left of the block
- `[TypeTag]` — type badge (reuse from Screen 2)
- Internal layout specific to data type (see below)

**String Layout:**
```
[KeyLabel: "session_token"]  [TypeTag: STRING]
─────────────────────────────────────────────
  ┌─────────────────────────────────────────┐
  │   "abc123xyz789"                        │
  └─────────────────────────────────────────┘
```
Single rectangular value box. `border: --border-width`, `radius-sm`, `padding: 12px`, `mono-sm`

**List Layout:**
```
[KeyLabel: "task_queue"]  [TypeTag: LIST]  [Length: 3 items]
──────────────────────────────────────────────────────────────
  HEAD                                              TAIL
  ┌───────────┐ ←→ ┌───────────┐ ←→ ┌───────────┐
  │  [0]      │    │  [1]      │    │  [2]      │
  │  "Job_C"  │    │  "Job_B"  │    │  "Job_A"  │
  └───────────┘    └───────────┘    └───────────┘
```
- Nodes: `border: --border-width`, `radius-sm`, `min-width: 96px`, `padding: 8px 12px`
- Index `[0]` label: `label-sm`, `--color-text-muted` inside node above value
- Connectors `←→`: `--color-text-muted`, `mono-sm`
- `HEAD` / `TAIL` labels: `label-sm`, `--color-text-muted`, positioned above first/last node
- **LPUSH** new node: slides in from left with `--color-delta-new` border flash
- **RPOP** node: fades out from right with `--color-delta-deleted`

**Hash Layout:**
```
[KeyLabel: "user:100"]  [TypeTag: HASH]  [Fields: 3]
──────────────────────────────────────────────────────
  ┌──────────────────┬──────────────────────────────┐
  │  FIELD           │  VALUE                       │
  ├──────────────────┼──────────────────────────────┤
  │  username        │  alice_dev                   │
  │  access_level    │  administrator               │
  │  created_at      │  1718300000                  │
  └──────────────────┴──────────────────────────────┘
```
Table layout. Header row: `--color-bg-surface`, `label-sm`. Value rows: `mono-sm`. Mutated field row: `--color-delta-changed` flash.

**Set Layout:**
```
[KeyLabel: "active_users"]  [TypeTag: SET]  [Members: 4, Unique]
─────────────────────────────────────────────────────────────────
  ╭──────────────────────────────────────────────────────────╮
  │   [uid:101]   [uid:102]   [uid:105]   [uid:109]          │
  │           (unordered — no duplicates)                    │
  ╰──────────────────────────────────────────────────────────╯
```
Each member: `[TagPill]` — `border: --border-width`, `radius: 99px`, `padding: 4px 10px`, `mono-sm`, `--color-accent-info` text
Pill group wraps freely inside rounded container border.
Duplicate insertion attempt: rejected pill shakes briefly, `--color-accent-danger` border, then vanishes.

**ZSet (Sorted Set) Layout:**
```
[KeyLabel: "leaderboard"]  [TypeTag: ZSET]  [Members: 3, Ordered by Score]
────────────────────────────────────────────────────────────────────────────
  Rank  Score   Member
  #1    1500    "player_A"   ████████████████████ 100%
  #2    1200    "player_B"   ████████████████     80%
  #3    800     "player_C"   ██████████           53%
```
Horizontal bar per member. Bar fill `--color-accent-primary` at opacity proportional to relative score.

---

### TTL Overlay (Global Modifier — applies to all structure types)
For any `[StructureBlock]` whose key has an active TTL:
- Render `[TTLProgressBar]` — thin strip at bottom of the block's border
  - `background: --color-bg-surface`, active fill `--color-accent-warn`
  - Fill width = `(remaining_ttl / original_ttl) * 100%`, animates smoothly
  - When `ttl ≤ 10s`: fill color shifts to `--color-accent-danger`, bar pulses
  - When `ttl = 0`: entire `[StructureBlock]` collapses vertically (height → 0, opacity → 0) over 400ms, labeled `[EVICTED]` briefly during collapse

---

## Navigation & Screen Routing

| From                   | Action                             | Destination     |
|------------------------|------------------------------------|-----------------|
| Landing Page           | Click `"Launch Lab"` (primary CTA) | Screen 2        |
| Landing Page           | Click `"View Documentation"`       | External docs   |
| Lab Interface (Screen 2) | Click `[Experiment]` in top bar  | Screen 3        |
| Lab Interface (Screen 2) | Click `[Visualize]` in top bar   | Screen 4        |
| Experiment (Screen 3)  | Terminal commands → bottom panel   | Screen 4 embed  |
| Any screen             | Click `"RSE"` logo                 | Landing Page    |

---

## Component Reuse Map

| Component                      | Used In              |
|--------------------------------|----------------------|
| `PanelHeader`                  | Screens 2, 3, 4      |
| `CommandConsolePanel`          | Screens 2, 3         |
| `TTLProgressBar`               | Screen 2 grid + Screen 4 visualizer |
| `TypeBadge`                    | Screens 2, 3, 4      |
| `StructuralVisualizerCanvas`   | Screens 3 (embed), 4 |
| `ExecutionTracePipeline`       | Screen 4             |

---

## Responsive Breakpoints

| Breakpoint   | Layout Change                                            |
|--------------|----------------------------------------------------------|
| `< 1280px`   | Screen 2: collapse right inspector into a slide-out drawer |
| `< 960px`    | Screen 2: stack left and center panels vertically         |
| `< 640px`    | Screen 1: single-column hero, feature cards stack        |

---

## Deliverables Checklist

- [ ] `docs/vision.md`
- [ ] `docs/roadmap.md`
- [ ] `docs/architecture.md`
- [ ] `docs/learning-modules.md`
- [ ] `docs/product-principles.md`
- [ ] `README.md`
- [ ] `frontend/RSE_Frontend_Spec_V2.md` ← this file
