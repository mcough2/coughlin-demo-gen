# Metronome Demo Generator

A Next.js web application for generating demo environments in Metronome. Create complete demo setups with billable metrics, products, rate cards, customers, contracts, and usage events.

## Features

- **Three Demo Types**:
  - **AI Platform** - Billable metrics and usage products for Code Assist, Chat, and Voice (`ai_platform.usage` events)
  - **Infra SaaS** - Infrastructure SaaS billing model with usage-based pricing
  - **Hybrid Seat+ Usage** - Combines seat-based pricing with usage-based charges

- **AI Platform Demo Includes**:
  - **Fixed products** (created only if missing): looked up by exact **name** on active `FIXED` products from the list API — **Prepaid Commit**, **Postpaid Commit**, **Credit**, **Trial Credit**, **SLA Credit** (not matched by id)
  - Six billable metrics: input and output token sums for **Code Assist**, **Chat**, and **Voice** (`api_product`: `code_assist`, `chat`, `realtime_voice`)
  - Matching usage products: `pricing_group_key` on `model` + `processing_tier`, `presentation_group_key` on `upstream_provider`, `user_id`, `team_id`, `project_id`, plus **quantity_conversion** (divide token counts by 1e6 so CSV **$/MTok** matches Metronome rate units)
  - **AI Platform Standard Rate Card** with rates loaded from `data/ai-pricebook.csv` via `addRates` (same batching pattern as Infra)
  - Does **not** create contracts or send usage events

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
2. Select a demo type (**AI Platform** or **Infra SaaS**)
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

**`model`** values are slug-style labels aligned with usage events (e.g. `gpt-5.4-mini`, `claude-sonnet-4-6`). **`processing_tier`** is `standard` or `batch`. Generate applies **quantity_conversion** on each usage product (divide raw token quantity by 1e6) and passes each CSV **`price`** (USD per million tokens) to `addRates` as **cents per million tokens** (`Math.round(price * 100)`), matching Infra’s “dollars per billed unit × 100” pattern.

## Project Structure

```
Metronome-Demo-Generator/
├── app/
│   ├── api/
│   │   ├── ai-platform/
│   │   │   └── generate/
│   │   │       └── route.ts          # AI Platform metrics, products, rate card + CSV rates
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
