---
name: Academic Operations System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#444653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#003d27'
  on-tertiary: '#ffffff'
  tertiary-container: '#00563a'
  on-tertiary-container: '#3fd298'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: '0'
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets administrative leaders, operational staff, and teaching faculty within modern educational institutions. The design language establishes authority, organizational calm, and operational precision. The experience eliminates cognitive drag across complex data structures—such as course rosters, cohort scheduling, attendance logging, tuition billing, and faculty allocation.

The visual style blends **Corporate Modern** with **High-Density Utility**:
- **Structured Precision:** Crisp borders, calibrated tonal separation, and typographic discipline replace decorative trends.
- **Calm Authority:** A baseline of cool slate neutrals anchored by royal and deep indigo ensures users feel in control of high-stakes academic and financial data.
- **Micro-Delight through Clarity:** High visual clarity, semantic color application for statuses (enrollment, waitlists, overdue tuition), and ergonomic data scanning across desktop dashboards.

## Colors

The palette balances administrative gravitas with instant semantic scannability:

### Brand & Interactive Colors
- **Primary Navy (`#1E40AF`):** Core structural brand color. Used for persistent primary navigation, key brand marks, table headers, and primary interaction triggers.
- **Secondary Indigo (`#2563EB`):** High-intent interactive state. Applied to focused states, primary buttons, active links, and pagination highlights.
- **Selected Surface Tint (`#EEF2FF`):** Reserved for active table rows, active sidebar items, hover fills, and multi-select highlight fills.
- **Interactive Focus Ring (`rgba(37, 99, 235, 0.2)`):** Accessible focus outline for all form elements and actionable components.

### Neutrals (Slate Hierarchy)
- **Canvas Base (`#F8FAFC`):** Main application background under cards and data tables.
- **Surface Elevation (`#FFFFFF`):** High-priority cards, modal layers, tables, and dropdown menus.
- **Subtle Surface (`#F1F5F9`):** Input field fills, table header rows, and disabled control fills.
- **Border Subtle (`#E2E8F0`):** Standard data cell borders, divider lines, and card containers.
- **Border Prominent (`#CBD5E1`):** Form control boundaries, interactive hover borders, and segmented control frames.
- **Text Primary (`#0F172A`):** Numbers, main titles, table text, and KPI figures.
- **Text Secondary (`#334155`):** Column headings, navigation labels, and secondary values.
- **Text Muted (`#64748B`):** Metadata, timestamp markers, search hints, and input placeholders.

### Semantic Accents
- **Emerald (`#10B981` / Light Tint `#ECFDF5`):** Active cohorts, verified attendance, cleared payments, confirmed enrollment.
- **Amber (`#F59E0B` / Light Tint `#FFFBEB`):** Pending approvals, trial classes, waitlists, unverified schedules.
- **Rose (`#EF4444` / Light Tint `#FEF2F2`):** Tuition arrears/debt, canceled sessions, missed attendance, urgent system alerts.

## Typography

The typographic hierarchy pairs **Plus Jakarta Sans** for structural headers with **Inter** for data readability:

- **Headlines (Plus Jakarta Sans):** Introduces friendly yet rigorous geometry to view headers, modal headers, and KPI numerals. Ensures administrative panels retain an executive, contemporary presence.
- **Body & Data (Inter):** Highly legible vertical proportion with neutral grotesk geometry ensures fast parsing of dense tables, multi-column student records, grade rosters, and audit trails.
- **Numeric Tabular Figures:** All monetary metrics, student counts, attendance percentages, and time schedules must leverage tabular numerals (`font-feature-settings: 'tnum' on, 'cv02' on`) to eliminate jitter and maintain vertical alignment in data grids.

## Layout & Spacing

The layout is architected around an administrative web application shell with a 12-column fluid grid:

### Screen Layout Hierarchy
- **Primary Shell:** Fixed left navigation sidebar (260px expanded, 72px collapsed icon-only) alongside a fluid administrative canvas.
- **Grid Layout:** 12-column fluid grid system bounded by `margin` (32px / 2rem) on desktop workspaces with `gutter` (24px / 1.5rem) column spacing.
- **Responsive Adaptations:**
  - **Desktop (>= 1280px):** Full 12 columns. Fixed side navigation, persistent top toolbar with global search, student switcher, and notifications.
  - **Tablet (768px - 1279px):** Collapsed 72px icon sidebar. 6-column grid structure with horizontal scroll preservation for complex data grids.
  - **Mobile (< 768px):** Off-canvas slide-out navigation drawer. 4-column layout with stacked card transitions for dense table records. Margins reduce to 16px (`margin-mobile`), gutters compress to 12px (`gutter-mobile`).

### Spacing Principles
- **Density Control:** Core tables and lists adhere to a tight 40px–48px row height default (using `space-sm` for vertical cell padding), ensuring at least 12–15 records display on standard laptop displays without scrolling.
- **KPI Metrics:** Spaced via `space-lg` gaps to separate critical performance numbers from secondary micro-charts.

## Elevation & Depth

Elevation conveys precise operational layering through crisp neutral borders combined with subtle, slate-tinted ambient shadows. Excessive blur and deep drop shadows are deliberately avoided to maintain visual clarity.

### Depth System
1. **Canvas Layer (Level 0):** Background foundation (`#F8FAFC`). Flat surface.
2. **Surface Layer (Level 1 - Cards, Tables, Toolbars):** Background `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
3. **Elevated Sidebar & Hover Surfaces (Level 2):** Background `#FFFFFF`, border `1px solid #E2E8F0`, shadow `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
4. **Popovers, Dropdowns, Date-Pickers (Level 3):** Background `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
5. **Modals & Flyout Drawers (Level 4):** Background `#FFFFFF`, border `1px solid #CBD5E1`, shadow `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`. Backed by an administrative scrim `rgba(15, 23, 42, 0.45)`.

## Shapes

The system uses **Soft (`1`)** roundedness. Curvature is kept subtle to reinforce structural efficiency, enterprise discipline, and crisp alignments across data-dense grids:

- **Base Controls & Inputs (`rounded`):** `0.25rem` (4px). Applied to standard inputs, select menus, table checkboxes, and segmented tabs.
- **Cards, Modals & Containers (`rounded-lg`):** `0.5rem` (8px). Applied to metric overview cards, data table wrappers, modal viewports, and panel drawers.
- **Flyouts & Dialog Prompts (`rounded-xl`):** `0.75rem` (12px). Reserved strictly for high-prominence notification toasts and primary modal dialog frames.
- **Pill Badges (`rounded-full`):** Full border radius reserved exclusively for status chips, student count indicators, and small avatar containers.

## Components

### Buttons
- **Primary:** Background `#1E40AF`, hover `#2563EB`, text `#FFFFFF`, border none, height 38px, horizontal padding 16px, font `label-lg`. Focus ring: 2px offset with `#2563EB` at 20% alpha.
- **Secondary / Outline:** Background `#FFFFFF`, hover `#F8FAFC`, text `#334155`, border `1px solid #CBD5E1`.
- **Tertiary / Ghost:** Background transparent, hover `#EEF2FF`, text `#1E40AF`.
- **Destructive:** Background `#FEF2F2`, hover `#EF4444` (with white text), text `#EF4444`, border `1px solid #FECACA`.

### Badges & Chips
- **General Badge:** Height 22px, padding 2px 8px, font `label-sm`, rounded-full.
- **Active / Enrolled:** Background `#ECFDF5`, text `#065F46`, border `1px solid #A7F3D0`.
- **Pending / Waitlist:** Background `#FFFBEB`, text `#92400E`, border `1px solid #FDE68A`.
- **Overdue / Alert:** Background `#FEF2F2`, text `#991B1B`, border `1px solid #FECACA`.
- **Neutral / Draft:** Background `#F1F5F9`, text `#475569`, border `1px solid #E2E8F0`.

### Data Tables
- **Container:** Wrapped in Level 1 surface card with `1px solid #E2E8F0`.
- **Header Row:** Background `#F8FAFC`, height 40px, text `label-md` in `#64748B`, uppercase tracking, border bottom `1px solid #E2E8F0`.
- **Body Rows:** Height 48px, text `body-md` in `#0F172A`, border bottom `1px solid #F1F5F9`. Hover state shifts row background to `#F8FAFC`.
- **Selected Row:** Background `#EEF2FF`, border bottom `1px solid #E0E7FF`. Left accent bar `2px solid #2563EB`.

### KPI Metric Cards
- **Padding:** 20px (`space-lg`), background `#FFFFFF`, border `1px solid #E2E8F0`, radius `0.5rem`.
- **Structure:** Top row houses the semantic metric title (`label-md` in `#64748B`) paired with a contextual status icon in a 32x32px tinted circle container. Middle row holds the primary headline metric (`headline-lg` in `#0F172A` with tabular figures). Bottom row shows trend indicators (+/- percentages with upward/downward arrows using Emerald or Rose) and comparison subtext.

### Form Controls
- **Inputs & Selects:** Height 38px, padding `0 12px`, background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`, placeholder `#94A3B8`, font `body-md`. Focus state transitions border to `#2563EB` with `0 0 0 3px rgba(37, 99, 235, 0.15)`.
- **Checkboxes & Radios:** Size 16x16px, border `1.5px solid #CBD5E1`, rounded 3px (checkbox) or circular (radio). Checked state triggers `#2563EB` fill with crisp white icon checkmark.

### Tab Bars
- **Underline Style:** Clean horizontal rule with active tab displaying `#1E40AF` text and a bottom 2px bar in `#1E40AF`. Inactive tabs display `#64748B` with hover shift to `#0F172A`.
- **Pill Segmented Style:** Inset slate container (`#F1F5F9`) with 4px padding. Active tab has white card fill (`#FFFFFF`), subtle shadow, and `#0F172A` text.