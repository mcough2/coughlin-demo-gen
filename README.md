# Metronome Demo Generator

A local webapp to generate demos on Metronome. Supports three demo types:
- **AI Token Based** (like OpenAI) - Token-based billing for AI/ML services
- **Infra SaaS** (like Confluent) - Infrastructure SaaS billing model
- **Hybrid Seat+ Usage** (like Notion) - Combines seat-based pricing with usage-based charges

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your Metronome API key in the webapp
2. Select a demo type (AI Token Based or Infra SaaS)
3. Configure and generate your demo

## Security

- API keys are only stored in browser state and sent to API routes - never logged or exposed
- All customer data is dynamically generated - no real customer information is used
- Console logging has been minimized to prevent exposure of sensitive data

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
