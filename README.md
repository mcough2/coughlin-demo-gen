# Metronome Demo Generator

A Next.js web application for generating demo environments in Metronome. Create complete demo setups with billable metrics, products, rate cards, customers, contracts, and usage events.

## Features

- **Three Demo Types**:
  - **AI Platform** - Billable metrics and usage products for Code Assist, Chat, and Voice (`ai_platform.usage` events)
  - **Infra SaaS** - Infrastructure SaaS billing model with usage-based pricing
  - **Hybrid Seat+ Usage** — Same catalog as AI Platform; rate card registers **1 AI Credit = $0.01 USD** and usage list rates use a **custom pricing unit ID** you provide (create AI Credits in Metronome first, then paste its UUID in the UI).

- **AI Platform Demo Includes**:
  - **Scope:** The generator creates the full **catalog** side of the demo: billable metrics, fixed and usage products, a rate card, and rates from `data/ai-pricebook.csv`. It does **not** create example customers, contracts, or sample usage events (add those yourself or use **Infra SaaS** for a full customer + usage walkthrough).
  - **Fixed products** (created only if missing): looked up by exact **name** on active `FIXED` products from the list API — **Prepaid Commit**, **Postpaid Commit**, **Credit**, **Trial Credit**, **SLA Credit** (not matched by id)
  - Six billable metrics: input and output token sums for **Code Assist**, **Chat**, and **Voice** (`api_product`: `code_assist`, `chat`, `realtime_voice`)
  - Matching usage products: `pricing_group_key` on `model` + `processing_tier`, `presentation_group_key` on `upstream_provider`, `user_id`, `team_id`, `project_id`, plus **quantity_conversion** (divide token counts by 1e6 so CSV **$/MTok** matches Metronome rate units)
  - **AI Platform Standard Rate Card** with rates loaded from `data/ai-pricebook.csv` via `addRates` (same batching pattern as Infra)

- **Infra SaaS Demo Includes**:
  - Billable metrics (Storage, Compute, Network Ingress/Egress)
  - Products (usage and fixed types)
  - Rate cards with pricing from CSV
  - Three customer types:
    - Paygo customer with free trial credits
    - Standard commit customer (1-year contract)
    - Advanced commit customer (3-year contract with multi-year commits)
  - Usage events generation for all customers
  - Contract overrides for commit customers

- **Sandbox Management**:
  - Clear/archive all demo objects (customers, rate cards, products, billable metrics)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Usage

1. Enter your Metronome API key in the webapp
2. Select a demo type (**AI Platform**, **Infra SaaS**, or **Hybrid Seat+ Usage**). For **Hybrid**, enter your custom pricing unit UUID (from Metronome or `GET /v1/credit-types/list`).
3. Click **Generate AI Platform Demo** or **Generate Infra SaaS Demo**
4. For **Infra SaaS**, the app will:
   - Create billable metrics
   - Create products
   - Create rate cards
   - Add rates from `data/pricebook.csv` to the Standard Rate Card
   - Create packages
   - Create customers with contracts
   - Generate usage events for all customers

5. For **AI Platform**, the app creates fixed products (if needed), the six metrics and usage products, the **AI Platform Standard Rate Card**, and rates from `data/ai-pricebook.csv`.

## AI Platform usage event schema (`ai_platform.usage`)

Send usage with event type **`ai_platform.usage`**. Properties should include:

| Property | Description |
|----------|-------------|
| `api_product` | `code_assist`, `chat`, or `realtime_voice` |
| `upstream_provider` | `openai` or `anthropic` |
| `model` | Model identifier for pricing |
| `processing_tier` | e.g. `standard`, `batch`, `flex`, `priority` |
| `user_id`, `team_id`, `project_id` | Presentation dimensions on the invoice |
| `input_tokens`, `output_tokens` | Counts to bill (non-negative numbers) |

Billable metrics use `group_keys` on all seven dimension fields. Usage products use a narrower `pricing_group_key` (`model`, `processing_tier`) and `presentation_group_key` (`upstream_provider`, `user_id`, `team_id`, `project_id`).

## AI Platform pricebook (`data/ai-pricebook.csv`)

Rates are **committed in this repo** (not fetched at runtime) from public list prices:

- [OpenAI API pricing](https://openai.com/api/pricing/) — GPT-5.4, GPT-5.4 mini, GPT-realtime-1.5 (audio **input/output** $/MTok for Voice).
- [Claude API pricing](https://platform.claude.com/docs/en/about-claude/pricing) — Claude Sonnet 4.6 (standard + batch table), Haiku 4.5 for Voice-style rows.

**As of:** March 2026 (re-copy from the sites when prices change).

**`price` column:** USD **per 1 million tokens** ($/MTok), matching the vendor tables. **OpenAI Batch** rows use **50% of** the listed standard input/output **$/MTok** ([Batch API](https://platform.openai.com/docs/guides/batch) discount). **Claude batch** rows use the **Batch input / Batch output** columns from Anthropic’s batch table.

**`model`** values are slug-style labels aligned with usage events (e.g. `gpt-5.4-mini`, `claude-sonnet-4-6`). **`processing_tier`** is `standard` or `batch`. Generate applies **quantity_conversion** on each usage product (divide raw token quantity by 1e6) and passes each CSV **`price`** (USD per million tokens) to `addRates` as **`Math.round(price * 100) / 100`**—the same $/MTok rounded to two decimals (100× smaller than the prior integer-cents encoding).

## Hybrid Seat+ Usage (design basis)

This use case builds on the **same underlying objects** as **AI Platform**: fixed catalog products (Prepaid Commit, etc.), the six token **billable metrics**, six **USAGE** products for Code Assist / Chat / Voice, `ai_platform.usage` ingest, dimensional pricing (`model`, `processing_tier`, presentation keys), and optional **subscription (“seat”)** products on the same **rate card**.

What makes it **hybrid**:

- **Seat / subscription:** Subscription SKUs (e.g. monthly/annual) are priced in **fiat**—typically **USD (cents)**—on the rate card (`rate_type` + `billing_frequency` as today).
- **Usage:** Token usage rows use the **custom pricing unit** **AI Credits** for list rates, not USD cents on the usage line. Each usage `addRates` payload sets **`credit_type_id`** to your AI Credits **credit type id**; subscription rows keep default fiat (or omit `credit_type_id` so USD applies).

### Prerequisites (order matters)

1. **Create the custom pricing unit (AI Credits) before creating the hybrid rate card.** Configure it in Metronome (Offering / **custom pricing units**). See Metronome’s guide: [Set currencies and custom pricing units](https://docs.metronome.com/guides/pricing-packaging/make-pricing-changes/use-currency-custompricingunits.md).
2. **Obtain the credit type id.** Call **`GET /v1/credit-types/list`** ([list pricing units](https://docs.metronome.com/api-reference/settings/list-pricing-units.md)) and find your AI Credits row; you need that **`id`** for the next steps.
3. **Create the rate card** with **`fiat_credit_type_id`** = USD (cents) (`2714e483-4ff1-48e4-9e25-ac732e8f24f2` unless your account uses another fiat) and **`credit_type_conversions`** including **`custom_credit_type_id`** = your AI Credits id and **`fiat_per_custom_credit`** set to match your commercial rule (e.g. **1 AI Credit = $0.01 USD** → **1 cent per credit** when fiat is cents: `fiat_per_custom_credit: 1`). Without registering the custom unit on the rate card, **`addRates`** will reject usage lines that reference that `credit_type_id`.
4. **Add rates:** subscription products in USD cents; usage products with **`credit_type_id`** = AI Credits id and prices expressed in **AI Credits** (derive from your pricebook rule—e.g. mapping from vendor **$/MTok** or from USD list rates divided into credits).

The in-app **AI Platform** generator today creates a **USD-only** list rate card from `data/ai-pricebook.csv`. A **hybrid** card in a live account is the same catalog, extended with **seat** SKUs and **usage** SKUs priced in **AI Credits** as above.

**Generator:** `POST /api/hybrid/generate` with `{ "apiKey", "customPricingUnitId" }` creates the same usage metrics/products as AI Platform, **Good / Better / Best Subscription** seat products (`type: subscription`), a **Hybrid Seat+ Usage Rate Card** with `credit_type_conversions` (1 cent fiat per 1 AI Credit), **`data/ai-pricebook.csv`** usage rates in AI Credits, and **six subscription list rates** (monthly + annual per tier, USD cents). The webapp exposes this under **Hybrid Seat+ Usage** (UUID field + Generate).

## Project Structure

```
Metronome-Demo-Generator/
├── app/
│   ├── api/
│   │   ├── ai-platform/
│   │   │   └── generate/
│   │   │       └── route.ts          # AI Platform metrics, products, rate card + CSV rates
│   │   ├── hybrid/
│   │   │   └── generate/
│   │   │       └── route.ts          # Hybrid: same catalog + AI Credits rate card + CSV
│   │   ├── infra-saas/
│   │   │   └── generate/
│   │   │       └── route.ts          # Infra SaaS demo generation
│   │   ├── rate-cards/
│   │   │   └── add-rates/
│   │   │       └── route.ts          # Add rates from CSV (standalone endpoint)
│   │   └── sandbox/
│   │       └── clear/
│   │           └── route.ts          # Archive all demo objects
│   ├── page.tsx                       # Main UI
│   ├── layout.tsx                      # Root layout
│   └── globals.css                     # Global styles
├── lib/
│   └── ai-platform-demo.ts             # Shared metrics/products/CSV helpers (AI + Hybrid)
├── data/
│   ├── pricebook.csv                   # Infra SaaS rate card rates
│   └── ai-pricebook.csv               # AI Platform rates ($/MTok from OAI + Anthropic list prices)
├── package.json
├── tsconfig.json
└── next.config.js
```

## Configuration

### Pricebook CSV

The `data/pricebook.csv` file contains pricing data that gets loaded into rate cards. Required columns:
- `product_name` - Must match product names exactly
- `price` - Price in dollars (will be converted to cents)
- `effective_at` - Optional, defaults to January 1st of current year
- Additional columns become `pricing_group_values` (e.g., `cluster_type`, `cloud_provider`, `region`)

## Security

- API keys are only stored in browser state and sent to API routes - never logged or exposed
- All customer data is dynamically generated - no real customer information is used
- Console logging has been minimized to prevent exposure of sensitive data
- Contract payloads are not logged to prevent exposure of customer/contract details

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Metronome API** - Billing and usage tracking platform

## Notes

- The Infra SaaS demo creates contracts starting on the first day of the current month at UTC midnight
- Free trial credits expire 3 months after contract start
- Standard commit contracts last 1 year
- Advanced commit contracts last 3 years with multi-year commit schedules
- Usage events are generated hourly from contract start date to current date
