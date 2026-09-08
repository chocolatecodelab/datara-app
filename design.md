# System Architecture & UI/UX Design Specification (design.md)
# Datara — AI Agentic Data Analyst Engine (Neobrutalism Edition)

| Metadata | Spesifikasi |
|---|---|
| **Document Type** | System Architecture & UI/UX Design Specification |
| **Product Name** | Datara — AI Agentic Data Analyst |
| **Visual Style Theme** | **Neobrutalism** (Chunky Black Borders, Hard Offset Shadows, Pop Pastels, Tactile Buttons) |
| **Target Framework** | Next.js 15 (App Router), Tailwind CSS v3.4+, shadcn/ui base |
| **Target PRD Baseline** | Datara PRD v1.0 |
| **Status** | Approved for Build |

---

## 1. Filosofi Desain & Aestetika Neobrutalism

Sesuai dengan arah visual produk generasi baru yang berani, komunikatif, dan berkarakter, **Datara** mengadopsi bahasa desain **Neobrutalism** (Neo-Brutalism). Pendekatan ini membuang estetika *soft-glow/glassmorphism* generik dan menggantinya dengan antarmuka yang sangat **taktil, tegas, dan berani**.

### Prinsip Utama Visual Neobrutalism Datara:
1. **High-Contrast Black Outlines:** Seluruh kartu, tombol, badge, dan modal dibingkai dengan garis tepi hitam tegas (`2px` - `3px` solid `#000000`).
2. **Hard Offset Drop Shadows:** Menggunakan bayangan solid tanpa blur radius (`4px 4px 0px #000000` atau `6px 6px 0px #000000`) yang memberikan impresi 3D fisik retro-modern.
3. **Vibrant Pop-Pastel Palette:** Latar belakang ruang kerja bernuansa *warm cream* (`#FAF6F0`) dipadukan dengan blok warna aksen mencolok: *Warm Yellow* (`#FFD12E`), *Pop Pink* (`#FF5388`), *Mint Teal* (`#2DD4BF`), dan *Electric Blue* (`#3B82F6`).
4. **Tactile Micro-Interactions:** Tombol dan elemen interaktif memberikan umpan balik fisik yang nyata — saat ditekan (*active/click*), bayangan menghilang dan kartu bergeser turun `translate-x-[4px] translate-y-[4px]`.
5. **Bold Typography Hierarchy:** Mengombinasikan font display berukuran besar dan *extra-bold* (`Space Grotesk` / `Plus Jakarta Sans`) dengan font monospace presisi (`JetBrains Mono` / `Geist Mono`) untuk visualisasi query dan data angka.

---

## 2. Design Tokens & Color Palette

```
+-----------------------------------------------------------------------------------+
| NEOBRUTALISM MAIN COLORS                                                          |
| Canvas Background:  #FAF6F0 (Warm Soft Cream)                                     |
| Surface Card Background: #FFFFFF (Pure White with 2px/3px Black Border)           |
| Ink / Border Color: #000000 (Pure Solid Black)                                    |
+-----------------------------------------------------------------------------------+
| POP ACCENTS & SEMANTIC COLORS (No Violet / Ungu)                                  |
| Primary Action / Highlight: #FFD12E (Warm Sunshine Yellow)                        |
| Brand Accent / Hero:       #FF5388 (Vibrant Magenta Pink)                         |
| Success / Growth Delta:    #2DD4BF (Mint Teal)                                    |
| Danger / Drop Delta:       #FF4757 (Pop Red)                                      |
| Tech / SQL / Code / Tags:  #3B82F6 (Electric Blue / Tech Cobalt)                  |
| Neutral Contrast Accent:   #000000 (Solid Black) / #FFFFFF (Pure White)           |
+-----------------------------------------------------------------------------------+
| HARD SHADOW SPECIFICATIONS                                                        |
| Small:  shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]                                    |
| Default: shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]                                    |
| Large:   shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]                                    |
| Hero:    shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]                                    |
+-----------------------------------------------------------------------------------+
```

### Konfigurasi Extended Tailwind (`tailwind.config.ts`)

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF6F0",
        surface: "#FFFFFF",
        ink: "#000000",
        brand: {
          yellow: "#FFD12E",
          pink: "#FF5388",
          teal: "#2DD4BF",
          blue: "#3B82F6",
          red: "#FF4757",
        },
        delta: {
          positive: "#2DD4BF",
          "positive-bg": "#E6FFFA",
          negative: "#FF4757",
          "negative-bg": "#FFE5E7",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "Plus Jakarta Sans", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-sm": "2px 2px 0px 0px #000000",
        "brutal-lg": "6px 6px 0px 0px #000000",
        "brutal-xl": "8px 8px 0px 0px #000000",
      },
      borderWidth: {
        DEFAULT: "2px",
        3: "3px",
        4: "4px",
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
```

---

## 3. Architecture & Layout Specification

Workstation Datara mengadopsi pola 3-pane Neobrutalist Shell dengan margin yang jelas, kartu melayang dengan bayangan solid, dan garis tepi hitam yang kontras.

```
+----------------------------------------------------------------------------------------------------+
| TOP NAV (Logo Datara, Active Data Source Badge, Semantic Layer Health Chip, User Badge)           |
+-------------------+---------------------------------------------------------+----------------------+
| SIDEBAR           | CENTRAL AGENTIC WORKSPACE                               | RIGHT INSPECTOR      |
| (260px)           | (Flex 1, Max 960px Content Canvas)                      | (340px)              |
|                   |                                                         |                      |
| [ + NEW GOAL ]    | [ ✦ Command & Input Bar with Floating Yellow Pill ]     | [ 🛠 AUDIT & SQL ]   |
| (Yellow Brutal)   |                                                         |                      |
|                   | [ Autonomous Investigation Plan Stepper Card ]          | • Executed SQL       |
| RECENT ANALYSIS   |   ├─ 1. Query baseline MoM                [✓ DONE]     | • AST Security Gate  |
| • Q3 Revenue Drop |   ├─ 2. Drilldown Jatim region            [🔄 ACTIVE]   | • Execution Latency  |
| • Churn Spike     |   └─ 3. Variance Decomposition            [○ QUEUED]   |                      |
|                   |                                                         | [ 🧠 AGENT MEMORY ]  |
| PINNED INSIGHTS   | [ Explainable Insight Report Card ]                     | "Revenue excludes    |
| • Margin Baseline |   ├─ Finding Headline & Confidence 87% Badge            |  tax" [Pill Badge]   |
|                   |   ├─ Driver Impact Waterfall Bars                       |                      |
| SYSTEM CONFIG     |   └─ Calculation Formula Code Block & Evidence Metrics  | [ EXPORT PDF / CSV ] |
+-------------------+---------------------------------------------------------+----------------------+
```

---

## 4. Core Subsystem & Neobrutalist UI Components

### 4.1 Autonomous Plan Stepper (`PlanVisualizer.tsx`)

```tsx
interface StepProps {
  stepNumber: number;
  title: string;
  status: "completed" | "analyzing" | "queued" | "failed";
  durationMs?: number;
  hasSql?: boolean;
}

export function NeobrutalPlanItem({ stepNumber, title, status, durationMs, hasSql }: StepProps) {
  return (
    <div className={`flex items-center justify-between p-3 mb-2 rounded-xl border-2 border-black font-mono transition-all ${
      status === "analyzing" 
        ? "bg-brand-yellow shadow-brutal font-bold text-black" 
        : status === "completed"
        ? "bg-white shadow-brutal-sm text-black"
        : "bg-slate-100 opacity-70 border-dashed text-slate-500"
    }`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 border-black font-extrabold text-xs ${
          status === "completed" ? "bg-brand-teal text-black" : status === "analyzing" ? "bg-black text-white animate-pulse" : "bg-white text-black"
        }`}>
          {status === "completed" ? "✓" : stepNumber}
        </span>
        <span className="font-sans text-sm font-bold text-black">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {durationMs && (
          <span className="px-2 py-0.5 rounded-md border border-black bg-white text-2xs font-mono font-bold text-black">
            {durationMs}ms
          </span>
        )}
        {hasSql && (
          <span className="px-2 py-0.5 rounded-md border-2 border-black bg-brand-blue text-white text-2xs font-extrabold uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            SQL
          </span>
        )}
      </div>
    </div>
  );
}
```

---

### 4.2 Explainable Insight Card (`InsightCard.tsx`)

```tsx
interface Driver {
  dimension: string;
  value: string;
  impact_pct: number;
}

export function NeobrutalInsightCard({
  finding,
  confidence,
  drivers,
  evidenceRows,
  formula,
}: {
  finding: string;
  confidence: number;
  drivers: Driver[];
  evidenceRows: number;
  formula: string;
}) {
  return (
    <div className="rounded-2xl border-3 border-black bg-white p-6 shadow-brutal-lg mb-6">
      {/* Header & Confidence Badge */}
      <div className="flex items-center justify-between border-b-3 border-black pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-brand-pink text-white font-extrabold text-xl shadow-brutal-sm">
            📊
          </span>
          <div>
            <span className="text-2xs font-mono uppercase tracking-widest font-extrabold text-slate-500">EXECUTIVE REPORT</span>
            <h3 className="font-display text-lg font-extrabold text-black">Variance & Root Cause Finding</h3>
          </div>
        </div>
        
        {/* Chunky Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-brand-teal px-4 py-1.5 text-xs font-extrabold text-black shadow-brutal-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-black animate-ping" />
          CONFIDENCE {Math.round(confidence * 100)}%
        </div>
      </div>

      {/* Main Finding Statement */}
      <div className="my-5 p-4 rounded-xl border-2 border-black bg-canvas">
        <p className="font-sans text-base font-bold text-black leading-relaxed">
          {finding}
        </p>
      </div>

      {/* Driver Contribution Waterfall */}
      <div className="space-y-3 rounded-xl border-2 border-black bg-white p-4 shadow-brutal-sm">
        <h4 className="font-mono text-2xs font-extrabold uppercase tracking-wider text-black">
          ROOT CAUSE VARIANCE CONTRIBUTION
        </h4>
        {drivers.map((driver, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between font-mono text-xs font-bold text-black">
              <span>{driver.value} <span className="text-slate-500 font-normal">({driver.dimension})</span></span>
              <span className="px-1.5 py-0.5 rounded border border-black bg-brand-red text-white font-bold">
                {driver.impact_pct}%
              </span>
            </div>
            {/* Chunky Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-md border-2 border-black bg-slate-100">
              <div
                className="h-full bg-brand-red transition-all duration-500"
                style={{ width: `${Math.min(Math.abs(driver.impact_pct), 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Evidence Footnote */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t-2 border-black font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-black">EVIDENCE:</span>
          <span className="px-2 py-0.5 rounded border border-black bg-slate-100 font-bold">{evidenceRows.toLocaleString()} Records</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-black">FORMULA:</span>
          <code className="px-2 py-0.5 rounded border border-black bg-brand-yellow font-bold text-black">
            {formula}
          </code>
        </div>
      </div>
    </div>
  );
}
```

---

### 4.3 Neobrutalist Command & Input Bar (`AgentPromptInput.tsx`)

```tsx
export function NeobrutalPromptInput({ onSubmit }: { onSubmit: (val: string) => void }) {
  return (
    <div className="relative rounded-2xl border-3 border-black bg-white p-4 shadow-brutal-lg">
      <textarea
        rows={2}
        placeholder="Beri goal terbuka (misal: 'Cari tahu penyebab revenue bulan ini turun')..."
        className="w-full resize-none bg-transparent font-sans text-sm font-bold text-black placeholder:text-slate-400 focus:outline-none"
      />
      <div className="flex items-center justify-between pt-3 border-t-2 border-black mt-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full border-2 border-black bg-brand-yellow text-xs font-extrabold text-black shadow-brutal-sm cursor-pointer hover:bg-yellow-300">
            ⚡ Metric: Revenue
          </span>
          <span className="px-3 py-1 rounded-full border-2 border-black bg-brand-blue text-xs font-extrabold text-white shadow-brutal-sm cursor-pointer">
            📅 MoM Comparison
          </span>
        </div>

        {/* Tactile Button Press Effect */}
        <button
          onClick={() => onSubmit("execute")}
          className="px-5 py-2 rounded-xl border-2 border-black bg-brand-yellow font-display font-extrabold text-sm text-black shadow-brutal hover:bg-yellow-400 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center gap-2"
        >
          <span>INVESTIGATE</span>
          <span className="text-base">➔</span>
        </button>
      </div>
    </div>
  );
}
```

---

### 4.4 Audit Trail & AST Inspector Drawer (`AuditDrawer.tsx`)

```tsx
export function NeobrutalAuditBlock({ sql, latencyMs }: { sql: string; latencyMs: number }) {
  return (
    <div className="rounded-xl border-3 border-black bg-black p-4 text-xs font-mono text-white shadow-brutal">
      <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-black bg-brand-teal" />
          <span className="font-extrabold text-brand-teal uppercase">AST Security Verified</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-2xs text-slate-300">{latencyMs}ms</span>
      </div>
      <pre className="overflow-x-auto text-brand-yellow leading-relaxed font-bold">
        <code>{sql}</code>
      </pre>
    </div>
  );
}
```

---

## 5. Micro-Interactions & Animation Specs

1. **Tactile Click State (Active State):**
```css
.btn-neobrutal {
  box-shadow: 4px 4px 0px #000000;
  transition: all 0.1s ease;
}
.btn-neobrutal:active {
  transform: translate(4px, 4px);
  box-shadow: 0px 0px 0px #000000;
}
```

2. **Pill Floating Animations:**
```css
@keyframes brutal-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}
.animate-brutal-float {
  animation: brutal-float 3s ease-in-out infinite;
}
```

---

## 6. Accessibility & High-Contrast Compliance

1. **Ultra High Contrast (WCAG AAA):** Kombinasi garis tepi hitam murni `#000000` di atas latar putih/pastel menjamin nilai rasio kontras melebihi `7:1` (WCAG AAA Compliance).
2. **Double Indicator Standard:** Informasi kenaikan/penurunan metrik tidak hanya mengandalkan warna, tetapi selalu dipadukan dengan teks kontras tinggi dan garis tepi kotak yang tegas.

---
*Dokumen Desain Neobrutalism — Datara AI Agentic Data Analyst Engine*