# Metronome Demo Generator

A Next.js web application for generating demo environments in Metronome. Create complete demo setups with billable metrics, products, rate cards, customers, contracts, and usage events.

## Features

- **Three Demo Types**:
  - **AI Token Based** - Token-based billing for AI/ML services
  - **Infra SaaS** - Infrastructure SaaS billing model with usage-based pricing
  - **Hybrid Seat+ Usage** - Combines seat-based pricing with usage-based charges

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
2. Select a demo type (currently only Infra SaaS is fully implemented)
3. Click "Generate Infra SaaS Demo" to create all demo objects
4. The app will:
   - Create billable metrics
   - Create products
   - Create rate cards
   - Add rates from `data/pricebook.csv` to the Standard Rate Card
   - Create packages
   - Create customers with contracts
   - Generate usage events for all customers

## Project Structure

```
Metronome-Demo-Generator/
├── app/
│   ├── api/
│   │   ├── infra-saas/
│   │   │   └── generate/
│   │   │       └── route.ts          # Main demo generation logic
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
│   └── pricebook.csv                   # Pricing data for rate cards
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
