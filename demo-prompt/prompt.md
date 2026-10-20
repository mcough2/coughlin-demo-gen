# Metronome Demo Generator

Use this skill to spin up a Metronome demo environment. It makes direct API calls to `https://api.metronome.com/v1` — no local app required.

This is a Claude Code skill. Invoke with `/metronome-demo` or when the user says "create a Metronome demo", "run the demo generator", "generate a Metronome environment".

---

## Step 1: Ask which demo to create

Ask the user: **"Which demo type do you want to generate?"**
**Options**:
1. **AI Platform** — Catalog only (6 billable metrics, 6 usage products, AI Platform Standard Rate Card with per-model/per-direction pricing). No customers or usage events. Best for AI API / developer platform prospects.
2. **Infra SaaS** — Full environment (4 metrics, 7 products, Standard Rate Card with multi-cloud pricing, 3 customers with contracts, synthetic hourly usage already ingested). Best for cloud infra / DevOps prospects.
3. **Hybrid Seat + Usage** — AI Platform catalog plus seat subscription products, hybrid rate card with AI Credits, 6 package templates, and an example contract. Best for SaaS prospects adding AI billing.
4. **GPU Reservations** — 7 SQL billable metrics that split per-minute GPU usage into regional reservation → shared global pool → on-demand, a rate card, one customer with an A100 reservation contract and named schedules, 9 usage events, an invoice check, and a Google Sheet that walks through every event. Best for GPU cloud / neocloud prospects (e.g., Crusoe, CoreWeave) with reserved + on-demand capacity.

---

## Step 2: Collect inputs

**All demo types**:
- Metronome API key (if not already known from context or a previous message this session)
- Whether to clear the sandbox first (recommend yes if re-running)

**Hybrid only**: No additional inputs required — the AI Credits custom pricing unit is created automatically via API in step 4.1.

**GPU Reservations only**: The Metronome account must have **named schedules** enabled (setup checks this first and stops before creating anything if it's off; ask Metronome to enable it). Clearing is optional: it only adds new objects and uses the IDs it creates, so it is safe to run in a sandbox that already has other demos. The Google Sheet step needs the Google Drive tools (`create_google_drive_sheet`, `add_sheet_to_google_drive_spreadsheet`, `format_google_drive_sheet`, `get_google_drive_sheet_in_spreadsheet`); if they aren't available, skip 4.4 and share the `/tmp/gpu_sheet_*.json` payloads instead.

---

## Step 3: Optionally clear the sandbox

If the user said yes to clearing, run these curl calls sequentially. Use `METRONOME_API_KEY` as the key throughout.

**Important**: Rate cards, billable metrics, and usage products are not idempotent in Metronome — running the generator twice without clearing creates duplicates.

### Archive customers (remove ingest aliases first, then archive)

```bash
# List all active customers
curl -s -X GET "https://api.metronome.com/v1/customers?limit=100" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json"
```

For each customer (where `archived_at` is null):
```bash
# Remove ingest aliases
curl -s -X POST "https://api.metronome.com/v1/customers/update" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<CUSTOMER_ID>", "ingest_aliases": []}'

# Archive customer
curl -s -X POST "https://api.metronome.com/v1/customers/archive" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "<CUSTOMER_ID>"}'
```

### Archive packages
```bash
# List packages
curl -s -X POST "https://api.metronome.com/v1/packages/list" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```
For each (where `archived_at` is null): `POST /packages/archive` with `{"package_id": "<ID>"}`.

### Archive rate cards
```bash
curl -s -X POST "https://api.metronome.com/v1/contract-pricing/rate-cards/list" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```
For each (where `archived_at` is null): `POST /contract-pricing/rate-cards/archive` with `{"id": "<ID>"}`.

### Archive products
```bash
curl -s -X POST "https://api.metronome.com/v1/contract-pricing/products/list" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"archive_filter": "NOT_ARCHIVED"}'
```
For each (where `archived_at` is null): `POST /contract-pricing/products/archive` with `{"product_id": "<ID>"}`.

### Archive billable metrics
```bash
curl -s -X GET "https://api.metronome.com/v1/billable-metrics?limit=100&include_archived=false" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json"
```
For each (where `archived_at` is null): `POST /billable-metrics/archive` with `{"id": "<ID>"}`.

Report archived counts per type once done.

---

## Step 4: Generate the demo

Work through these steps sequentially, capturing IDs from each response for use in the next step. Report each step as it completes.

---

### AI Platform

#### 4.1 Create 6 billable metrics

`POST https://api.metronome.com/v1/billable-metrics/create` for each:

```json
{"name":"Code Assist - Input Tokens","event_type_filter":{"in_values":["ai_platform.usage"]},"property_filters":[{"name":"input_tokens","exists":true},{"name":"api_product","exists":true,"in_values":["code_assist"]},{"name":"upstream_provider","exists":true},{"name":"model","exists":true},{"name":"processing_tier","exists":true},{"name":"user_id","exists":true},{"name":"team_id","exists":true},{"name":"project_id","exists":true}],"aggregation_type":"sum","aggregation_key":"input_tokens","group_keys":[["api_product","upstream_provider","model","processing_tier","user_id","team_id","project_id"]]}

{"name":"Code Assist - Output Tokens","event_type_filter":{"in_values":["ai_platform.usage"]},"property_filters":[{"name":"output_tokens","exists":true},{"name":"api_product","exists":true,"in_values":["code_assist"]},{"name":"upstream_provider","exists":true},{"name":"model","exists":true},{"name":"processing_tier","exists":true},{"name":"user_id","exists":true},{"name":"team_id","exists":true},{"name":"project_id","exists":true}],"aggregation_type":"sum","aggregation_key":"output_tokens","group_keys":[["api_product","upstream_provider","model","processing_tier","user_id","team_id","project_id"]]}

{"name":"Chat - Input Tokens","event_type_filter":{"in_values":["ai_platform.usage"]},"property_filters":[{"name":"input_tokens","exists":true},{"name":"api_product","exists":true,"in_values":["chat"]},{"name":"upstream_provider","exists":true},{"name":"model","exists":true},{"name":"processing_tier","exists":true},{"name":"user_id","exists":true},{"name":"team_id","exists":true},{"name":"project_id","exists":true}],"aggregation_type":"sum","aggregation_key":"input_tokens","group_keys":[["api_product","upstream_provider","model","processing_tier","user_id","team_id","project_id"]]}

{"name":"Chat - Output Tokens","event_type_filter":{"in_values":["ai_platform.usage"]},"property_filters":[{"name":"output_tokens","exists":true},{"name":"api_product","exists":true,"in_values":["chat"]},{"name":"upstream_provider","exists":true},{"name":"model","exists":true},{"name":"processing_tier","exists":true},{"name":"user_id","exists":true},{"name":"team_id","exists":true},{"name":"project_id","exists":true}],"aggregation_type":"sum","aggregation_key":"output_tokens","group_keys":[["api_product","upstream_provider","model","processing_tier","user_id","team_id","project_id"]]}

{"name":"Voice - Input Tokens","event_type_filter":{"in_values":["ai_platform.usage"]},"property_filters":[{"name":"input_tokens","exists":true},{"name":"api_product","exists":true,"in_values":["realtime_voice"]},{"name":"upstream_provider","exists":true},{"name":"model","exists":true},{"name":"processing_tier","exists":true},{"name":"user_id","exists":true},{"name":"team_id","exists":true},{"name":"project_id","exists":true}],"aggregation_type":"sum","aggregation_key":"input_tokens","group_keys":[["api_product","upstream_provider","model","processing_tier","user_id","team_id","project_id"]]}

{"name":"Voice - Output Tokens","event_type_filter":{"in_values":["ai_platform.usage"]},"property_filters":[{"name":"output_tokens","exists":true},{"name":"api_product","exists":true,"in_values":["realtime_voice"]},{"name":"upstream_provider","exists":true},{"name":"model","exists":true},{"name":"processing_tier","exists":true},{"name":"user_id","exists":true},{"name":"team_id","exists":true},{"name":"project_id","exists":true}],"aggregation_type":"sum","aggregation_key":"output_tokens","group_keys":[["api_product","upstream_provider","model","processing_tier","user_id","team_id","project_id"]]}
```

Capture: `{metric_name → data.id}` from each response.

#### 4.2 Create 6 usage products

`POST https://api.metronome.com/v1/contract-pricing/products/create` for each metric. Product names match metric names exactly. Use the `billable_metric_id` from step 4.1.

Template (repeat for all 6, substituting `<NAME>` and `<METRIC_ID>`):
```json
{
  "name": "<NAME>",
  "type": "usage",
  "billable_metric_id": "<METRIC_ID>",
  "pricing_group_key": ["model", "processing_tier"],
  "presentation_group_key": ["upstream_provider", "user_id", "team_id", "project_id"],
  "quantity_conversion": {"operation": "divide", "conversion_factor": 1000000, "name": "tokens to million tokens"},
  "tags": ["all"]
}
```

Capture: `{product_name → data.id}`.

#### 4.3 Ensure fixed products exist

List products (`POST /contract-pricing/products/list` with `{}`), filter to `type: FIXED`. For any of the following that don't exist yet, create them with `POST /contract-pricing/products/create`:

```json
{"name": "Prepaid Commit", "type": "fixed"}
{"name": "Postpaid Commit", "type": "fixed"}
{"name": "Credit", "type": "fixed"}
{"name": "Trial Credit", "type": "fixed"}
{"name": "SLA Credit", "type": "fixed"}
```

Capture: `{product_name → id}` for all 5.

#### 4.4 Create the rate card

```bash
curl -s -X POST "https://api.metronome.com/v1/contract-pricing/rate-cards/create" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "AI Platform Standard Rate Card"}'
```

Capture: `rate_card_id = data.id`.

#### 4.5 Add rates to the rate card

Use the inline pricebook data below. The columns are: `product_name, model, processing_tier, price, effective_at, entitled, rate_type`.

```
product_name,model,processing_tier,price,effective_at,entitled,rate_type
Code Assist - Input Tokens,gpt-5.4-mini,standard,0.75,2026-03-01T00:00:00Z,true,flat
Code Assist - Output Tokens,gpt-5.4-mini,standard,4.5,2026-03-01T00:00:00Z,true,flat
Chat - Input Tokens,gpt-5.4-mini,standard,0.75,2026-03-01T00:00:00Z,true,flat
Chat - Output Tokens,gpt-5.4-mini,standard,4.5,2026-03-01T00:00:00Z,true,flat
Code Assist - Input Tokens,gpt-5.4-mini,batch,0.375,2026-03-01T00:00:00Z,true,flat
Code Assist - Output Tokens,gpt-5.4-mini,batch,2.25,2026-03-01T00:00:00Z,true,flat
Chat - Input Tokens,gpt-5.4-mini,batch,0.375,2026-03-01T00:00:00Z,true,flat
Chat - Output Tokens,gpt-5.4-mini,batch,2.25,2026-03-01T00:00:00Z,true,flat
Chat - Input Tokens,gpt-5.4,standard,2.5,2026-03-01T00:00:00Z,true,flat
Chat - Output Tokens,gpt-5.4,standard,15,2026-03-01T00:00:00Z,true,flat
Chat - Input Tokens,gpt-5.4,batch,1.25,2026-03-01T00:00:00Z,true,flat
Chat - Output Tokens,gpt-5.4,batch,7.5,2026-03-01T00:00:00Z,true,flat
Voice - Input Tokens,gpt-realtime-1.5,standard,32,2026-03-01T00:00:00Z,true,flat
Voice - Output Tokens,gpt-realtime-1.5,standard,64,2026-03-01T00:00:00Z,true,flat
Code Assist - Input Tokens,claude-sonnet-4-6,standard,3,2026-03-01T00:00:00Z,true,flat
Code Assist - Output Tokens,claude-sonnet-4-6,standard,15,2026-03-01T00:00:00Z,true,flat
Chat - Input Tokens,claude-sonnet-4-6,standard,3,2026-03-01T00:00:00Z,true,flat
Chat - Output Tokens,claude-sonnet-4-6,standard,15,2026-03-01T00:00:00Z,true,flat
Code Assist - Input Tokens,claude-sonnet-4-6,batch,1.5,2026-03-01T00:00:00Z,true,flat
Code Assist - Output Tokens,claude-sonnet-4-6,batch,7.5,2026-03-01T00:00:00Z,true,flat
Chat - Input Tokens,claude-sonnet-4-6,batch,1.5,2026-03-01T00:00:00Z,true,flat
Chat - Output Tokens,claude-sonnet-4-6,batch,7.5,2026-03-01T00:00:00Z,true,flat
Voice - Input Tokens,claude-haiku-4-5,standard,1,2026-03-01T00:00:00Z,true,flat
Voice - Output Tokens,claude-haiku-4-5,standard,5,2026-03-01T00:00:00Z,true,flat
Voice - Input Tokens,claude-haiku-4-5,batch,0.5,2026-03-01T00:00:00Z,true,flat
Voice - Output Tokens,claude-haiku-4-5,batch,2.5,2026-03-01T00:00:00Z,true,flat
```

For each row, look up `product_id` from step 4.2 by matching `product_name`. Build:
```json
{
  "product_id": "<from step 4.2>",
  "starting_at": "<effective_at from CSV>",
  "entitled": true,
  "rate_type": "flat",
  "price": <price as float, no unit conversion>,
  "pricing_group_values": {"model": "<model>", "processing_tier": "<processing_tier>"}
}
```

Send all rates in one call:
```bash
curl -s -X POST "https://api.metronome.com/v1/contract-pricing/rate-cards/addRates" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"rate_card_id": "<RATE_CARD_ID>", "rates": [...]}'
```

**Verification**: 6 billable metrics, 6 usage products, 1 rate card with 26 rates.

---

### Infra SaaS

Run AI Platform steps 4.3 first (ensure fixed products), then:

#### 4.1 Create 4 billable metrics

`POST https://api.metronome.com/v1/billable-metrics/create` for each:

```json
{"name":"Storage (GiB-minutes)","event_type_filter":{"in_values":["cluster_heartbeat"]},"property_filters":[{"name":"storage_gib_minutes","exists":true},{"name":"cluster_type","exists":true},{"name":"team_id","exists":true},{"name":"cluster_id","exists":true},{"name":"region","exists":true},{"name":"cloud_provider","exists":true}],"aggregation_type":"sum","aggregation_key":"storage_gib_minutes","group_keys":[["cluster_type","cloud_provider","region","team_id","cluster_id"]]}

{"name":"Compute (CPU-minutes)","event_type_filter":{"in_values":["cluster_heartbeat"]},"property_filters":[{"name":"cpu_minutes","exists":true},{"name":"cluster_type","exists":true},{"name":"team_id","exists":true},{"name":"cluster_id","exists":true},{"name":"region","exists":true},{"name":"cloud_provider","exists":true}],"aggregation_type":"sum","aggregation_key":"cpu_minutes","group_keys":[["cluster_type","cloud_provider","region","team_id","cluster_id"]]}

{"name":"Network Ingress (GB)","event_type_filter":{"in_values":["cluster_heartbeat"]},"property_filters":[{"name":"ingress_gb","exists":true},{"name":"cluster_type","exists":true},{"name":"team_id","exists":true},{"name":"cluster_id","exists":true},{"name":"region","exists":true},{"name":"cloud_provider","exists":true}],"aggregation_type":"sum","aggregation_key":"ingress_gb","group_keys":[["cluster_type","cloud_provider","region","team_id","cluster_id"]]}

{"name":"Network Egress (GB)","event_type_filter":{"in_values":["cluster_heartbeat"]},"property_filters":[{"name":"egress_gb","exists":true},{"name":"cluster_type","exists":true},{"name":"team_id","exists":true},{"name":"cluster_id","exists":true},{"name":"region","exists":true},{"name":"cloud_provider","exists":true}],"aggregation_type":"sum","aggregation_key":"egress_gb","group_keys":[["cluster_type","cloud_provider","region","team_id","cluster_id"]]}
```

#### 4.2 Create 7 products

Usage products (4) — use `pricing_group_key: ["cluster_type", "cloud_provider", "region"]`, `presentation_group_key: ["cluster_id", "team_id"]`, `tags: ["all"]`, no `quantity_conversion`. Match `billable_metric_id` from step 4.1 by name:
- Storage (GiB-minutes)
- Compute (CPU-minutes)
- Network Ingress (GB)
- Network Egress (GB)

Fixed products:
```json
{"name": "Free Trial Credits", "type": "fixed"}
```

Note: **do not create a second "Prepaid Commit"** — reuse the ID from AI Platform step 4.3. Capture it as `infra_prepaid_commit_id`.

Composite product (1):
```json
{"name": "Support", "type": "composite", "composite_tags": ["all"]}
```

#### 4.3 Create the rate card

```json
{"name": "Standard Rate Card"}
```

Capture: `rate_card_id`.

#### 4.4 Add rates

Use the inline pricebook data below. Columns: `product_name, cluster_type, cloud_provider, region, price, rate_type, effective_at, entitled`.

```
product_name,cluster_type,cloud_provider,region,price,rate_type,effective_at,entitled
Storage (GiB-minutes),basic,aws,us-east-1,0.10,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,aws,us-west-2,0.10,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,aws,eu-west-1,0.12,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,aws,ap-southeast-1,0.12,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,aws,eu-central-1,0.12,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,azure,eastus,0.12,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,azure,westus2,0.12,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,azure,westeurope,0.14,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,azure,southeastasia,0.14,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,azure,centralus,0.12,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,gcp,us-central1,0.14,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,gcp,us-east1,0.14,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,gcp,europe-west1,0.16,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,gcp,asia-southeast1,0.16,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),basic,gcp,us-west1,0.14,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,aws,us-east-1,0.15,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,aws,us-west-2,0.15,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,aws,eu-west-1,0.18,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,aws,ap-southeast-1,0.18,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,aws,eu-central-1,0.18,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,azure,eastus,0.18,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,azure,westus2,0.18,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,azure,westeurope,0.21,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,azure,southeastasia,0.21,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,azure,centralus,0.18,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,gcp,us-central1,0.21,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,gcp,us-east1,0.21,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,gcp,europe-west1,0.24,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,gcp,asia-southeast1,0.24,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),standard,gcp,us-west1,0.21,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,aws,us-east-1,0.25,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,aws,us-west-2,0.25,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,aws,eu-west-1,0.30,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,aws,ap-southeast-1,0.30,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,aws,eu-central-1,0.30,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,azure,eastus,0.30,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,azure,westus2,0.30,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,azure,westeurope,0.35,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,azure,southeastasia,0.35,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,azure,centralus,0.30,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,gcp,us-central1,0.35,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,gcp,us-east1,0.35,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,gcp,europe-west1,0.40,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,gcp,asia-southeast1,0.40,flat,2026-01-01T00:00:00Z,true
Storage (GiB-minutes),advanced,gcp,us-west1,0.35,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,aws,us-east-1,0.08,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,aws,us-west-2,0.08,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,aws,eu-west-1,0.10,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,aws,ap-southeast-1,0.10,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,aws,eu-central-1,0.10,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,azure,eastus,0.10,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,azure,westus2,0.10,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,azure,westeurope,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,azure,southeastasia,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,azure,centralus,0.10,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,gcp,us-central1,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,gcp,us-east1,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,gcp,europe-west1,0.14,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,gcp,asia-southeast1,0.14,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),basic,gcp,us-west1,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,aws,us-east-1,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,aws,us-west-2,0.12,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,aws,eu-west-1,0.15,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,aws,ap-southeast-1,0.15,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,aws,eu-central-1,0.15,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,azure,eastus,0.15,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,azure,westus2,0.15,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,azure,westeurope,0.18,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,azure,southeastasia,0.18,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,azure,centralus,0.15,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,gcp,us-central1,0.18,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,gcp,us-east1,0.18,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,gcp,europe-west1,0.21,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,gcp,asia-southeast1,0.21,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),standard,gcp,us-west1,0.18,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,aws,us-east-1,0.20,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,aws,us-west-2,0.20,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,aws,eu-west-1,0.25,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,aws,ap-southeast-1,0.25,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,aws,eu-central-1,0.25,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,azure,eastus,0.25,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,azure,westus2,0.25,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,azure,westeurope,0.30,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,azure,southeastasia,0.30,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,azure,centralus,0.25,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,gcp,us-central1,0.30,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,gcp,us-east1,0.30,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,gcp,europe-west1,0.35,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,gcp,asia-southeast1,0.35,flat,2026-01-01T00:00:00Z,true
Compute (CPU-minutes),advanced,gcp,us-west1,0.30,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,aws,us-east-1,0.05,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,aws,us-west-2,0.05,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,aws,eu-west-1,0.06,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,aws,ap-southeast-1,0.06,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,aws,eu-central-1,0.06,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,azure,eastus,0.06,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,azure,westus2,0.06,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,azure,westeurope,0.07,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,azure,southeastasia,0.07,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,azure,centralus,0.06,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,gcp,us-central1,0.07,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,gcp,us-east1,0.07,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,gcp,europe-west1,0.08,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,gcp,asia-southeast1,0.08,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),basic,gcp,us-west1,0.07,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,aws,us-east-1,0.08,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,aws,us-west-2,0.08,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,aws,eu-west-1,0.10,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,aws,ap-southeast-1,0.10,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,aws,eu-central-1,0.10,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,azure,eastus,0.10,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,azure,westus2,0.10,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,azure,westeurope,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,azure,southeastasia,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,azure,centralus,0.10,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,gcp,us-central1,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,gcp,us-east1,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,gcp,europe-west1,0.14,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,gcp,asia-southeast1,0.14,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),standard,gcp,us-west1,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,aws,us-east-1,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,aws,us-west-2,0.12,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,aws,eu-west-1,0.15,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,aws,ap-southeast-1,0.15,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,aws,eu-central-1,0.15,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,azure,eastus,0.15,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,azure,westus2,0.15,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,azure,westeurope,0.18,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,azure,southeastasia,0.18,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,azure,centralus,0.15,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,gcp,us-central1,0.18,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,gcp,us-east1,0.18,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,gcp,europe-west1,0.21,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,gcp,asia-southeast1,0.21,flat,2026-01-01T00:00:00Z,true
Network Ingress (GB),advanced,gcp,us-west1,0.18,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,aws,us-east-1,0.09,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,aws,us-west-2,0.09,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,aws,eu-west-1,0.11,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,aws,ap-southeast-1,0.11,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,aws,eu-central-1,0.11,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,azure,eastus,0.11,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,azure,westus2,0.11,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,azure,westeurope,0.13,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,azure,southeastasia,0.13,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,azure,centralus,0.11,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,gcp,us-central1,0.13,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,gcp,us-east1,0.13,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,gcp,europe-west1,0.15,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,gcp,asia-southeast1,0.15,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),basic,gcp,us-west1,0.13,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,aws,us-east-1,0.14,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,aws,us-west-2,0.14,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,aws,eu-west-1,0.17,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,aws,ap-southeast-1,0.17,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,aws,eu-central-1,0.17,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,azure,eastus,0.17,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,azure,westus2,0.17,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,azure,westeurope,0.20,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,azure,southeastasia,0.20,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,azure,centralus,0.17,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,gcp,us-central1,0.20,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,gcp,us-east1,0.20,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,gcp,europe-west1,0.23,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,gcp,asia-southeast1,0.23,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),standard,gcp,us-west1,0.20,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,aws,us-east-1,0.22,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,aws,us-west-2,0.22,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,aws,eu-west-1,0.27,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,aws,ap-southeast-1,0.27,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,aws,eu-central-1,0.27,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,azure,eastus,0.27,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,azure,westus2,0.27,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,azure,westeurope,0.32,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,azure,southeastasia,0.32,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,azure,centralus,0.27,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,gcp,us-central1,0.32,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,gcp,us-east1,0.32,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,gcp,europe-west1,0.38,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,gcp,asia-southeast1,0.38,flat,2026-01-01T00:00:00Z,true
Network Egress (GB),advanced,gcp,us-west1,0.32,flat,2026-01-01T00:00:00Z,true
```

For each row, price is multiplied by 100 (convert USD to cents):
```json
{
  "product_id": "<from step 4.2>",
  "starting_at": "<effective_at from CSV>",
  "entitled": true,
  "rate_type": "flat",
  "price": <price * 100>,
  "pricing_group_values": {"cluster_type": "<cluster_type>", "cloud_provider": "<cloud_provider>", "region": "<region>"}
}
```

Send all rates via `POST /contract-pricing/rate-cards/addRates` (batch up to 100 at a time).

#### 4.5 Create 3 customers and contracts

Use today's date to compute:
- `start_date`: first day of current month at 00:00:00Z (e.g. `2026-10-01T00:00:00Z`)
- `3mo_later`: 3 months after start_date
- `1yr_later`: 12 months after start_date
- `3yr_later`: 36 months after start_date

**Customer 1: Paygo**

```bash
curl -s -X POST "https://api.metronome.com/v1/customers" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Paygo customer", "ingest_aliases": ["paygo-customer-<RANDOM_6_DIGITS>"]}'
```

Contract:
```json
{
  "customer_id": "<PAYGO_CUSTOMER_ID>",
  "starting_at": "<start_date>",
  "name": "paygo contract",
  "rate_card_id": "<RATE_CARD_ID>",
  "credits": [{
    "product_id": "<Free Trial Credits product_id>",
    "access_schedule": {
      "schedule_items": [{"amount": 500000, "starting_at": "<start_date>", "ending_before": "<3mo_later>"}]
    },
    "priority": 1
  }]
}
```

**Customer 2: Commit (advanced cluster)**

```bash
curl -s -X POST "https://api.metronome.com/v1/customers" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Commit customer (advanced cluster)", "ingest_aliases": ["commit-customer-advanced-<RANDOM_6_DIGITS>"]}'
```

Contract (3-year with escalating prepaid commits, 20% discount on all usage):
```json
{
  "customer_id": "<ADVANCED_CUSTOMER_ID>",
  "starting_at": "<start_date>",
  "name": "enterprise customer (3-year)",
  "rate_card_id": "<RATE_CARD_ID>",
  "ending_before": "<3yr_later>",
  "commits": [{
    "product_id": "<Prepaid Commit product_id>",
    "access_schedule": {
      "schedule_items": [
        {"amount": 7500000, "starting_at": "<start_date>", "ending_before": "<3yr_later>"},
        {"amount": 10000000, "starting_at": "<1yr_later>", "ending_before": "<3yr_later>"},
        {"amount": 12500000, "starting_at": "<2yr_later>", "ending_before": "<3yr_later>"}
      ]
    },
    "invoice_schedule": {
      "schedule_items": [
        {"timestamp": "<start_date>", "amount": 7500000},
        {"timestamp": "<1yr_later>", "amount": 10000000},
        {"timestamp": "<2yr_later>", "amount": 12500000}
      ]
    },
    "priority": 1,
    "type": "PREPAID"
  }],
  "overrides": [
    {"product_id": "<Storage product_id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Compute product_id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Network Ingress product_id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Network Egress product_id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"}
  ]
}
```

Note: `<2yr_later>` = 24 months after start_date.

**Customer 3: Commit (standard cluster)**

```bash
curl -s -X POST "https://api.metronome.com/v1/customers" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Commit customer (standard cluster)", "ingest_aliases": ["commit-customer-standard-<RANDOM_6_DIGITS>"]}'
```

Contract (1-year, $50k prepaid, 10% discount on storage and compute only):
```json
{
  "customer_id": "<STANDARD_CUSTOMER_ID>",
  "starting_at": "<start_date>",
  "name": "standard cluster customer (one-year)",
  "rate_card_id": "<RATE_CARD_ID>",
  "ending_before": "<1yr_later>",
  "commits": [{
    "product_id": "<Prepaid Commit product_id>",
    "access_schedule": {
      "schedule_items": [{"amount": 5000000, "starting_at": "<start_date>", "ending_before": "<1yr_later>"}]
    },
    "invoice_schedule": {
      "schedule_items": [{"timestamp": "<start_date>", "amount": 5000000}]
    },
    "priority": 1,
    "type": "PREPAID"
  }],
  "overrides": [
    {"product_id": "<Storage product_id>", "type": "MULTIPLIER", "multiplier": 0.9, "starting_at": "<start_date>"},
    {"product_id": "<Compute product_id>", "type": "MULTIPLIER", "multiplier": 0.9, "starting_at": "<start_date>"}
  ]
}
```

#### 4.6 Generate and ingest usage events

Write a Python script to generate hourly `cluster_heartbeat` events from the start of the current month through now, then POST them to `/ingest`. Use the ingest aliases from step 4.5.

```python
import uuid, random, datetime, json, urllib.request, urllib.error

API_KEY = "<METRONOME_API_KEY>"
INGEST_URL = "https://api.metronome.com/v1/ingest"

# Set these from previous step results
PAYGO_ALIAS = "<paygo ingest alias>"
STANDARD_ALIAS = "<standard ingest alias>"
ADVANCED_ALIAS = "<advanced ingest alias>"

now = datetime.datetime.utcnow()
start = datetime.datetime(now.year, now.month, 1, 0, 0, 0)

def gen_cluster_id():
    animals = ["lion","tiger","bear","wolf","fox","eagle","hawk","owl","shark","whale","dolphin","elephant"]
    return f"{random.choice(animals)}-{random.randint(100000,999999)}"

paygo_c1, paygo_c2 = gen_cluster_id(), gen_cluster_id()
std_basic, std_standard = gen_cluster_id(), gen_cluster_id()
adv_aws_small, adv_aws_normal, adv_azure = gen_cluster_id(), gen_cluster_id(), gen_cluster_id()

events = []
t = start
while t < now:
    ts = t.strftime("%Y-%m-%dT%H:%M:%SZ")
    # Paygo: 2 basic AWS clusters
    for cid in [paygo_c1, paygo_c2]:
        events.append({"transaction_id": str(uuid.uuid4()), "customer_id": PAYGO_ALIAS, "event_type": "cluster_heartbeat", "timestamp": ts, "properties": {"cluster_id": cid, "team_id": "team-paygo-001", "cluster_type": "basic", "region": "us-east-1", "cloud_provider": "aws", "storage_gib_minutes": round(random.uniform(0.5, 1.5), 3), "cpu_minutes": round(random.uniform(1.0, 3.0), 3), "ingress_gb": round(random.uniform(0.05, 0.15), 3), "egress_gb": round(random.uniform(0.05, 0.15), 3)}})
    # Standard: 1 basic + 1 standard AWS cluster
    events.append({"transaction_id": str(uuid.uuid4()), "customer_id": STANDARD_ALIAS, "event_type": "cluster_heartbeat", "timestamp": ts, "properties": {"cluster_id": std_basic, "team_id": "team-standard-001", "cluster_type": "basic", "region": "us-east-1", "cloud_provider": "aws", "storage_gib_minutes": round(random.uniform(0.05, 0.15), 3), "cpu_minutes": round(random.uniform(0.1, 0.3), 3), "ingress_gb": round(random.uniform(0.005, 0.015), 3), "egress_gb": round(random.uniform(0.005, 0.015), 3)}})
    events.append({"transaction_id": str(uuid.uuid4()), "customer_id": STANDARD_ALIAS, "event_type": "cluster_heartbeat", "timestamp": ts, "properties": {"cluster_id": std_standard, "team_id": "team-standard-001", "cluster_type": "standard", "region": "us-west-2", "cloud_provider": "aws", "storage_gib_minutes": round(random.uniform(0.5, 1.5), 3), "cpu_minutes": round(random.uniform(1.0, 3.0), 3), "ingress_gb": round(random.uniform(0.05, 0.15), 3), "egress_gb": round(random.uniform(0.05, 0.15), 3)}})
    # Advanced: 2 AWS + 1 Azure cluster
    events.append({"transaction_id": str(uuid.uuid4()), "customer_id": ADVANCED_ALIAS, "event_type": "cluster_heartbeat", "timestamp": ts, "properties": {"cluster_id": adv_aws_small, "team_id": "team-advanced-001", "cluster_type": "standard", "region": "us-east-1", "cloud_provider": "aws", "storage_gib_minutes": round(random.uniform(0.005, 0.015), 3), "cpu_minutes": round(random.uniform(0.01, 0.03), 3), "ingress_gb": round(random.uniform(0.0005, 0.0015), 3), "egress_gb": round(random.uniform(0.0005, 0.0015), 3)}})
    events.append({"transaction_id": str(uuid.uuid4()), "customer_id": ADVANCED_ALIAS, "event_type": "cluster_heartbeat", "timestamp": ts, "properties": {"cluster_id": adv_aws_normal, "team_id": "team-advanced-001", "cluster_type": "advanced", "region": "us-east-1", "cloud_provider": "aws", "storage_gib_minutes": round(random.uniform(0.5, 1.5), 3), "cpu_minutes": round(random.uniform(1.0, 3.0), 3), "ingress_gb": round(random.uniform(0.05, 0.15), 3), "egress_gb": round(random.uniform(0.05, 0.15), 3)}})
    events.append({"transaction_id": str(uuid.uuid4()), "customer_id": ADVANCED_ALIAS, "event_type": "cluster_heartbeat", "timestamp": ts, "properties": {"cluster_id": adv_azure, "team_id": "team-advanced-002", "cluster_type": "advanced", "region": "eastus", "cloud_provider": "azure", "storage_gib_minutes": round(random.uniform(0.5, 1.5), 3), "cpu_minutes": round(random.uniform(1.0, 3.0), 3), "ingress_gb": round(random.uniform(0.05, 0.15), 3), "egress_gb": round(random.uniform(0.05, 0.15), 3)}})
    t += datetime.timedelta(hours=1)

# Send in batches of 100
sent = 0
for i in range(0, len(events), 100):
    batch = events[i:i+100]
    data = json.dumps(batch).encode()
    req = urllib.request.Request(INGEST_URL, data=data, headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        sent += len(batch)

print(f"Sent {sent} events")
```

Save the script to `/tmp/infra_usage.py`, then run with: `python3 -I /tmp/infra_usage.py`

**Verification**: 4 billable metrics, 7 products, 1 rate card, 3 customers with contracts and usage events.

---

### Hybrid Seat + Usage

#### 4.1 Create the AI Credits custom pricing unit

```bash
curl -s -X POST "https://api.metronome.com/v1/credit-types/create" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "AI Credits", "client_id": "ai_credits"}'
```

Capture: `ai_credits_uuid = data.id`.

If the call returns a duplicate error (credit type already exists), retrieve the existing UUID:

```bash
curl -s -X GET "https://api.metronome.com/v1/credit-types/list" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json"
```

Find the entry with `name: "AI Credits"` and capture its `id`.

#### 4.2 Ensure fixed products
Same as AI Platform step 4.3. You need the `Credit` product ID specifically for recurring credits.

#### 4.3–4.4 Create AI Platform catalog
Run AI Platform steps 4.1–4.2 (6 billable metrics + 6 usage products). Capture all product IDs.

#### 4.5 Create 3 seat subscription products

```json
{"name": "Good Subscription", "type": "subscription", "tags": ["seat", "hybrid"]}
{"name": "Better Subscription", "type": "subscription", "tags": ["seat", "hybrid"]}
{"name": "Best Subscription", "type": "subscription", "tags": ["seat", "hybrid"]}
```

(Skip if they already exist — list products, filter to `type: SUBSCRIPTION` first.)

#### 4.6 Create the hybrid rate card

```json
{
  "name": "Hybrid Seats + Usage Rate Card",
  "description": "Hybrid Seat+ Usage: token usage from ai-pricebook priced in AI Credits; 1 AI Credit = $0.01 USD.",
  "fiat_credit_type_id": "2714e483-4ff1-48e4-9e25-ac732e8f24f2",
  "credit_type_conversions": [{
    "custom_credit_type_id": "<ai_credits_uuid from step 4.1>",
    "fiat_per_custom_credit": 1
  }]
}
```

Capture: `hybrid_rate_card_id`.

#### 4.7 Add AI usage rates (with credit_type_id)

Same as AI Platform step 4.5, but add `"credit_type_id": "<ai_credits_uuid from step 4.1>"` to every rate object. Price values stay as floats (no cents conversion).

#### 4.8 Add seat subscription rates

`effective_at` = Jan 1 of current year at 00:00:00Z (e.g. `2026-01-01T00:00:00Z`).

`POST /contract-pricing/rate-cards/addRates` with these rates (prices in USD cents):
```json
[
  {"product_id": "<Good Subscription id>", "starting_at": "<effective_at>", "entitled": true, "rate_type": "flat", "price": 1000, "billing_frequency": "MONTHLY", "pricing_group_values": {}},
  {"product_id": "<Good Subscription id>", "starting_at": "<effective_at>", "entitled": true, "rate_type": "flat", "price": 10000, "billing_frequency": "ANNUAL", "pricing_group_values": {}},
  {"product_id": "<Better Subscription id>", "starting_at": "<effective_at>", "entitled": true, "rate_type": "flat", "price": 2000, "billing_frequency": "MONTHLY", "pricing_group_values": {}},
  {"product_id": "<Better Subscription id>", "starting_at": "<effective_at>", "entitled": true, "rate_type": "flat", "price": 20000, "billing_frequency": "ANNUAL", "pricing_group_values": {}},
  {"product_id": "<Best Subscription id>", "starting_at": "<effective_at>", "entitled": true, "rate_type": "flat", "price": 3000, "billing_frequency": "MONTHLY", "pricing_group_values": {}},
  {"product_id": "<Best Subscription id>", "starting_at": "<effective_at>", "entitled": true, "rate_type": "flat", "price": 30000, "billing_frequency": "ANNUAL", "pricing_group_values": {}}
]
```

All to `hybrid_rate_card_id`.

#### 4.9 Create 6 package templates

`POST https://api.metronome.com/v1/packages/create` for each of the 6 combos. Template pattern below — substitute values per spec.

Package specs (name, subscription product, billing_frequency, recurring_credit_unit_price, recurrence_frequency):
- `Good (Monthly)` / Good Subscription / MONTHLY / 500 / (implicit MONTHLY)
- `Good (Annual)` / Good Subscription / ANNUAL / 500 / MONTHLY
- `Better (Monthly)` / Better Subscription / MONTHLY / 1000 / (implicit MONTHLY)
- `Better (Annual)` / Better Subscription / ANNUAL / 1000 / MONTHLY
- `Best (Monthly)` / Best Subscription / MONTHLY / 2000 / (implicit MONTHLY)
- `Best (Annual)` / Best Subscription / ANNUAL / 2000 / MONTHLY

Template body for each (generate a unique UUID for `tmplSubId` and `uniqueness_key`):
```json
{
  "name": "<NAME>",
  "rate_card_id": "<HYBRID_RATE_CARD_ID>",
  "uniqueness_key": "<UUID>",
  "usage_statement_schedule": {"frequency": "MONTHLY", "day": "FIRST_OF_MONTH"},
  "multiplier_override_prioritization": "LOWEST_MULTIPLIER",
  "subscriptions": [{
    "temporary_id": "<TMPL_SUB_UUID>",
    "collection_schedule": "ADVANCE",
    "proration": {"is_prorated": true, "invoice_behavior": "BILL_IMMEDIATELY"},
    "initial_quantity": 1,
    "quantity_management_mode": "QUANTITY_ONLY",
    "starting_at_offset": {"value": 0, "unit": "DAYS"},
    "subscription_rate": {
      "billing_frequency": "<MONTHLY or ANNUAL>",
      "product_id": "<SUBSCRIPTION_PRODUCT_ID>"
    },
    "fiat_credit_type_id": "2714e483-4ff1-48e4-9e25-ac732e8f24f2",
    "custom_fields": {}
  }],
  "recurring_credits": [{
    "name": "Included AI Credits for <NAME>",
    "product_id": "<Credit fixed product id>",
    "access_amount": {
      "unit_price": <RECURRING_CREDIT_UNIT_PRICE>,
      "credit_type_id": "<ai_credits_uuid from step 4.1>"
    },
    "priority": 1,
    "rate_type": "LIST_RATE",
    "starting_at_offset": {"value": 0, "unit": "DAYS"},
    "commit_duration": {"value": 1, "unit": "PERIODS"},
    "proration": "FIRST_AND_LAST",
    "recurrence_frequency": "MONTHLY",
    "subscription_config": {
      "subscription_id": "<TMPL_SUB_UUID>",
      "allocation": "POOLED",
      "apply_seat_increase_config": {"is_prorated": true}
    }
  }]
}
```

For Annual packages, set `recurrence_frequency: "MONTHLY"` on the recurring credit; for Monthly packages, omit `recurrence_frequency` (defaults to MONTHLY).

#### 4.10 Create example customer and contract

```bash
curl -s -X POST "https://api.metronome.com/v1/customers" \
  -H "Authorization: Bearer $METRONOME_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "enterprise customer", "ingest_aliases": ["hybrid-seat-demo-<RANDOM_8_CHARS>"]}'
```

Contract (SEAT_BASED, Better + Best subscriptions, recurring AI Credits, 20% discount):

Use `starting_at` = first day of current month at 00:00:00Z.

Generate unique UUIDs for `BETTER_TMP_ID` and `BEST_TMP_ID`.

```json
{
  "customer_id": "<CUSTOMER_ID>",
  "starting_at": "<start_date>",
  "name": "Hybrid Seats + Usage Example Contract",
  "rate_card_id": "<HYBRID_RATE_CARD_ID>",
  "subscriptions": [
    {
      "collection_schedule": "ADVANCE",
      "proration": {"is_prorated": false, "invoice_behavior": "BILL_IMMEDIATELY"},
      "subscription_rate": {"product_id": "<Better Subscription id>", "billing_frequency": "MONTHLY"},
      "quantity_management_mode": "SEAT_BASED",
      "temporary_id": "<BETTER_TMP_ID>",
      "seat_config": {
        "seat_group_key": "user_id",
        "initial_seat_ids": ["alex_001","jamie_002","taylor_003","morgan_004","casey_005","riley_006","jordan_007","avery_008","quinn_009","blake_010"]
      }
    },
    {
      "collection_schedule": "ADVANCE",
      "proration": {"is_prorated": false, "invoice_behavior": "BILL_IMMEDIATELY"},
      "subscription_rate": {"product_id": "<Best Subscription id>", "billing_frequency": "MONTHLY"},
      "quantity_management_mode": "SEAT_BASED",
      "temporary_id": "<BEST_TMP_ID>",
      "seat_config": {
        "seat_group_key": "user_id",
        "initial_seat_ids": ["dakota_011","skyler_012"]
      }
    }
  ],
  "recurring_credits": [
    {
      "name": "included credits for better subscription",
      "product_id": "<Credit fixed product id>",
      "starting_at": "<start_date>",
      "priority": 1,
      "commit_duration": {"value": 1, "unit": "PERIODS"},
      "recurrence_frequency": "MONTHLY",
      "access_amount": {"credit_type_id": "<ai_credits_uuid from step 4.1>", "unit_price": 1200},
      "subscription_config": {
        "subscription_id": "<BETTER_TMP_ID>",
        "allocation": "INDIVIDUAL",
        "apply_seat_increase_config": {"is_prorated": false}
      }
    },
    {
      "name": "included credits for best subscriptions",
      "product_id": "<Credit fixed product id>",
      "starting_at": "<start_date>",
      "priority": 2,
      "commit_duration": {"value": 1, "unit": "PERIODS"},
      "recurrence_frequency": "MONTHLY",
      "access_amount": {"credit_type_id": "<ai_credits_uuid from step 4.1>", "unit_price": 2500},
      "subscription_config": {
        "subscription_id": "<BEST_TMP_ID>",
        "allocation": "INDIVIDUAL",
        "apply_seat_increase_config": {"is_prorated": false}
      }
    }
  ],
  "overrides": [
    {"product_id": "<Good Subscription id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Better Subscription id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Best Subscription id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Chat - Input Tokens product_id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"},
    {"product_id": "<Chat - Output Tokens product_id>", "type": "MULTIPLIER", "multiplier": 0.8, "starting_at": "<start_date>"}
  ],
  "uniqueness_key": "<UUID>"
}
```

**Verification**: Everything from AI Platform + 3 seat products, hybrid rate card, 6 package templates, 1 example customer in the Dashboard.

#### 4.11 Ingest usage events for the example customer

Write a Python script to send 14 days of daily `ai_platform.usage` events across 6 rate combos, targeting ~300 AI Credits total. Use the ingest alias from step 4.10.

```python
import uuid, datetime, json, urllib.request

API_KEY = "<METRONOME_API_KEY>"
INGEST_URL = "https://api.metronome.com/v1/ingest"
CUSTOMER_ALIAS = "<hybrid-seat-demo ingest alias>"

# 14 daily events: first day of current month through today at noon UTC
now = datetime.datetime.utcnow()
start = datetime.datetime(now.year, now.month, 1, 12, 0, 0)
days = []
t = start
while t <= now.replace(hour=12, minute=0, second=0, microsecond=0):
    days.append(t)
    t += datetime.timedelta(days=1)

# 6 rate combos, ~50 AI Credits each = ~300 total
# Formula: tokens_per_event = 50 / rate_per_MTok * 1_000_000 / len(days)
rates = [
    {"api_product": "chat",           "model": "gpt-5.4-mini",      "processing_tier": "standard", "upstream_provider": "openai",    "token_key": "input_tokens",  "tokens_per_day": 4761905, "user_id": "alex_001",   "team_id": "team-eng", "project_id": "proj-chat"},
    {"api_product": "chat",           "model": "gpt-5.4-mini",      "processing_tier": "standard", "upstream_provider": "openai",    "token_key": "output_tokens", "tokens_per_day": 793651,  "user_id": "jamie_002",  "team_id": "team-eng", "project_id": "proj-chat"},
    {"api_product": "code_assist",    "model": "claude-sonnet-4-6", "processing_tier": "standard", "upstream_provider": "anthropic", "token_key": "input_tokens",  "tokens_per_day": 1190476, "user_id": "taylor_003", "team_id": "team-eng", "project_id": "proj-code"},
    {"api_product": "code_assist",    "model": "claude-sonnet-4-6", "processing_tier": "standard", "upstream_provider": "anthropic", "token_key": "output_tokens", "tokens_per_day": 238095,  "user_id": "morgan_004", "team_id": "team-eng", "project_id": "proj-code"},
    {"api_product": "realtime_voice", "model": "gpt-realtime-1.5",  "processing_tier": "standard", "upstream_provider": "openai",    "token_key": "input_tokens",  "tokens_per_day": 111607,  "user_id": "dakota_011", "team_id": "team-ops", "project_id": "proj-voice"},
    {"api_product": "realtime_voice", "model": "gpt-realtime-1.5",  "processing_tier": "standard", "upstream_provider": "openai",    "token_key": "output_tokens", "tokens_per_day": 55804,   "user_id": "skyler_012", "team_id": "team-ops", "project_id": "proj-voice"},
]

events = []
for day in days:
    ts = day.strftime("%Y-%m-%dT%H:%M:%SZ")
    for r in rates:
        events.append({
            "transaction_id": str(uuid.uuid4()),
            "customer_id": CUSTOMER_ALIAS,
            "event_type": "ai_platform.usage",
            "timestamp": ts,
            "properties": {
                r["token_key"]: r["tokens_per_day"],
                "api_product": r["api_product"],
                "model": r["model"],
                "processing_tier": r["processing_tier"],
                "upstream_provider": r["upstream_provider"],
                "user_id": r["user_id"],
                "team_id": r["team_id"],
                "project_id": r["project_id"],
            },
        })

sent = 0
for i in range(0, len(events), 100):
    batch = events[i:i+100]
    data = json.dumps(batch).encode()
    req = urllib.request.Request(INGEST_URL, data=data, headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        sent += len(batch)

print(f"Sent {sent} events (~300 AI Credits across 6 rates × {len(days)} days)")
```

Save to `/tmp/hybrid_usage.py`, then run with: `python3 -I /tmp/hybrid_usage.py`

**Rate breakdown** (~50 AI Credits each):
- Chat Input / gpt-5.4-mini / standard (0.75 credits/MTok) — user: alex_001
- Chat Output / gpt-5.4-mini / standard (4.5 credits/MTok) — user: jamie_002
- Code Assist Input / claude-sonnet-4-6 / standard (3 credits/MTok) — user: taylor_003
- Code Assist Output / claude-sonnet-4-6 / standard (15 credits/MTok) — user: morgan_004
- Voice Input / gpt-realtime-1.5 / standard (32 credits/MTok) — user: dakota_011
- Voice Output / gpt-realtime-1.5 / standard (64 credits/MTok) — user: skyler_012

---

### GPU Reservations

Models a GPU cloud that sells reserved capacity per region plus a shared global pool, and bills anything above the reservations on-demand. Every minute of usage is split three ways by SQL billable metrics:

1. **Regional reservation**: each zone's own reservation covers its usage first.
2. **Global pool**: overflow draws from a shared pool in fixed order: us-east → us-west → us-central (highest on-demand rate first).
3. **On-demand**: whatever is left bills at the zone's on-demand rate.

Reservations live on the contract as **named schedules** (`/contracts/updateNamedSchedule`), and the SQL reads them with `scheduleValue(...)` at each event's timestamp, so mid-contract or backdated reservation changes re-rate automatically. No PRAGMAs are needed.

**What gets created** (new objects every run; nothing is reused except an existing `A100 Reservation` subscription product):
- 7 SQL billable metrics on `instance` events (`properties.sku`, `properties.zone`, `properties.billable_value` = GPUs running)
  - `GPU On-Demand — us-east` / `us-west` / `us-central`
  - `GPU Reserved — us-east` / `us-west` / `us-central` / `global`
  - Output is GPU-seconds (per-minute GPU count × 60)
- 7 usage products (one per metric): `pricing_group_key: ["sku"]`, `presentation_group_key: ["sku", "zone"]`, quantity conversion ÷ 3,600 → GPU-hours
- `A100 Reservation` subscription product (reused if one already exists)
- "GPU Reservations Rate Card" with 8 rates starting the first day of last month:
  - On-demand A100: us-east $10/GPU-hr, us-west $5/GPU-hr, us-central $3/GPU-hr
  - All 4 reserved products: $0 (they exist so the invoice shows reservation use)
  - A100 Reservation: $1,000 per GPU per month
- 1 customer `GPU Reservations Demo <6 digits>` with ingest alias `gpu-reservations-demo-<6 digits>`
- 1 contract starting the first day of last month: A100 Reservation subscription × 8, billed monthly in advance
- 4 named schedules on the contract: `us-east-reserved-instance` = 2, `us-west-reserved-instance` = 2, `us-central-reserved-instance` = 4 (properties `{sku, zone}`), and `global-reserved-instance` = 2 (properties `{sku}`)
- 9 `instance` events at 10:00, 10:01 and 10:02 UTC on the first day of the current month, one per zone per minute:
  - **10:00**: east 5, west 3, central 4. East's overflow uses the whole global pool, so west spills to on-demand.
  - **10:01**: east 3, west 4, central 6. East and west split the pool, so central spills to on-demand.
  - **10:02**: east 1, west 2, central 7. East is under its reservation, and the pool reaches central.
- A Google Sheet (Overview, Events, Allocation, Invoice tabs) with live formulas that reproduce the waterfall and reconcile against the Metronome invoice

#### 4.1 Save the script

Save this exactly to `/tmp/gpu_reservations_demo.py`:

```python
"""GPU Reservations demo for Metronome: regional + global GPU reservations with on-demand overflow.

  METRONOME_API_KEY=... python3 -I /tmp/gpu_reservations_demo.py setup   # build catalog, customer, contract, schedules, 9 events
  METRONOME_API_KEY=... python3 -I /tmp/gpu_reservations_demo.py verify  # poll the draft invoice and compare to expected
  python3 -I /tmp/gpu_reservations_demo.py sheet                         # write Google Sheet payloads to /tmp/gpu_sheet_*.json
  METRONOME_API_KEY=... python3 -I /tmp/gpu_reservations_demo.py cleanup # archive only what the last setup created
"""
import datetime as dt
import json
import os
import random
import sys
import time
import urllib.error
import urllib.request

API = "https://api.metronome.com"
STATE = "/tmp/gpu_reservations_demo.json"
SKU = "A100"
ZONES = ["us-east", "us-west", "us-central"]
RESERVATIONS = {"us-east": 2, "us-west": 2, "us-central": 4, "global": 2}
ON_DEMAND_CENTS = {"us-east": 1000, "us-west": 500, "us-central": 300}
RESERVATION_PRODUCT = "A100 Reservation"
RESERVATION_FEE_CENTS = 100000
RESERVATION_QTY = 8
# (minute offset from 10:00 UTC on the 1st of the current month, GPUs reported per zone)
USAGE = [
    (0, {"us-east": 5, "us-west": 3, "us-central": 4}),  # east overflow uses the whole global pool
    (1, {"us-east": 3, "us-west": 4, "us-central": 6}),  # east + west split the pool; central spills
    (2, {"us-east": 1, "us-west": 2, "us-central": 7}),  # east under reservation; pool reaches central
]

INNER = """  FROM (
    SELECT
      SUM(CAST(properties.billable_value AS DOUBLE)) AS gpu_count,
      properties.sku AS sku,
      properties.zone AS zone,
      DATE_TRUNC('minute', timestamp) AS ts
    FROM events
    WHERE event_type = 'instance'
    GROUP BY sku, zone, ts
  )"""


def overage_col(zone):
    short = zone.split("-")[1]
    return (f"    SUM(CASE WHEN zone = '{zone}' THEN GREATEST(0, gpu_count - COALESCE(scheduleValue("
            f"'{zone}-reserved-instance', {{ sku: sku, zone: zone }}, ts), 0)) ELSE 0 END) AS {short}_overage,")


def pooled_sql(zones, expr, out_col, label):
    cols = "\n".join(overage_col(z) for z in zones)
    return (f"SELECT\n  SUM({expr} * 60) AS {out_col},\n  '{label}' AS zone,\n  sku\nFROM (\n  SELECT\n    sku,\n    ts,\n"
            f"{cols}\n    MAX(COALESCE(scheduleValue('global-reserved-instance', {{ sku: sku }}, ts), 0)) AS global_reserved\n"
            f"{INNER}\n  GROUP BY sku, ts\n)\nGROUP BY sku\n")


def regional_reserved_sql(zone):
    return (f"SELECT\n  SUM(LEAST(gpu_count, COALESCE(scheduleValue('{zone}-reserved-instance', {{ sku: sku, zone: zone }}, ts), 0)) * 60)"
            f" AS reserved_gpu_seconds,\n  '{zone}' AS zone,\n  sku\nFROM (\n  SELECT\n"
            f"    SUM(CAST(properties.billable_value AS DOUBLE)) AS gpu_count,\n    properties.sku AS sku,\n"
            f"    properties.zone AS zone,\n    DATE_TRUNC('minute', timestamp) AS ts\n  FROM events\n"
            f"  WHERE event_type = 'instance' AND properties.zone = '{zone}'\n  GROUP BY sku, zone, ts\n)\nGROUP BY sku\n")


METRICS = [
    ("GPU On-Demand — us-east", ["gpu", "on-demand"],
     pooled_sql(["us-east"], "GREATEST(0, east_overage - global_reserved)", "on_demand_gpu_seconds", "us-east")),
    ("GPU On-Demand — us-west", ["gpu", "on-demand"],
     pooled_sql(["us-east", "us-west"], "GREATEST(0, west_overage - GREATEST(0, global_reserved - east_overage))",
                "on_demand_gpu_seconds", "us-west")),
    ("GPU On-Demand — us-central", ["gpu", "on-demand"],
     pooled_sql(ZONES, "GREATEST(0, central_overage - GREATEST(0, global_reserved - east_overage - west_overage))",
                "on_demand_gpu_seconds", "us-central")),
    ("GPU Reserved — us-east", ["gpu", "reserved"], regional_reserved_sql("us-east")),
    ("GPU Reserved — us-west", ["gpu", "reserved"], regional_reserved_sql("us-west")),
    ("GPU Reserved — us-central", ["gpu", "reserved"], regional_reserved_sql("us-central")),
    ("GPU Reserved — global", ["gpu", "reserved"],
     pooled_sql(ZONES, "LEAST(global_reserved, east_overage + west_overage + central_overage)", "reserved_gpu_seconds", "global")),
]


def call(method, path, body=None, fatal=True):
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {os.environ['METRONOME_API_KEY']}", "Content-Type": "application/json"},
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode()
        if not fatal:
            return {"error": e.code, "detail": detail}
        hint = f"\nObjects created so far are recorded in {STATE}; run `cleanup` to archive them." if os.path.exists(STATE) else ""
        sys.exit(f"FAIL {method} {path}: {e.code} {detail}{hint}")


def save(state):
    with open(STATE, "w") as f:
        json.dump(state, f, indent=2)


def preflight():
    """Named schedules are enabled per Metronome account; fail before creating anything if they're off."""
    zero = "00000000-0000-0000-0000-000000000000"
    r = call("POST", "/v1/contracts/getNamedSchedule",
             {"customer_id": zero, "contract_id": zero, "schedule_name": "preflight-check"}, fatal=False)
    if "NAMED_SCHEDULES" in r.get("detail", ""):
        sys.exit("STOP: named schedules are not enabled on this Metronome account (getNamedSchedule → "
                 "'Resource not found: NAMED_SCHEDULES'). Ask Metronome to enable named schedules, or use another "
                 "sandbox. Nothing was created.")
    if r.get("error") == 401:
        sys.exit("STOP: the API key was rejected (401). Nothing was created.")


def iso(t):
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def allocate(counts):
    """Same order of operations as the SQL: regional first, then the global pool east → west → central."""
    left = RESERVATIONS["global"]
    out = {}
    for zone in ZONES:
        u = counts[zone]
        reg = min(u, RESERVATIONS[zone])
        over = u - reg
        g = min(over, left)
        out[zone] = {"reported": u, "regional": reg, "overflow": over, "pool_left": left, "global": g, "on_demand": over - g}
        left -= g
    return out


def find_subscription_product(name):
    path = "/v1/contract-pricing/products/list"
    while True:
        r = call("POST", path, {"archive_filter": "NOT_ARCHIVED"})
        for p in r.get("data", []):
            if p.get("type") == "SUBSCRIPTION" and p["current"]["name"] == name:
                return p["id"]
        if not r.get("next_page"):
            return None
        path = f"/v1/contract-pricing/products/list?next_page={r['next_page']}"


def setup():
    now = dt.datetime.now(dt.timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    contract_start = (month_start - dt.timedelta(days=1)).replace(day=1)
    usage_base = month_start + dt.timedelta(hours=10)
    if now < usage_base + dt.timedelta(minutes=3):
        sys.exit(f"Usage is timestamped {iso(usage_base)}; re-run after {iso(usage_base + dt.timedelta(minutes=3))}.")
    preflight()

    suffix = f"{random.randint(0, 999999):06d}"
    alias = f"gpu-reservations-demo-{suffix}"

    events, allocation = [], []
    totals = {name: 0 for name, _, _ in METRICS}
    for offset, counts in USAGE:
        ts = iso(usage_base + dt.timedelta(minutes=offset))
        for zone in ZONES:
            events.append({"transaction_id": f"{alias}-{ts}-{zone}-{SKU}", "customer_id": alias, "event_type": "instance",
                           "timestamp": ts, "properties": {"sku": SKU, "zone": zone, "billable_value": counts[zone]}})
        for zone, a in allocate(counts).items():
            allocation.append({"minute": ts, "zone": zone, **a})
            totals[f"GPU Reserved — {zone}"] += a["regional"]
            totals["GPU Reserved — global"] += a["global"]
            totals[f"GPU On-Demand — {zone}"] += a["on_demand"]
    expected = {}
    for name, minutes in totals.items():
        zone = name.split("— ")[1]
        cents = ON_DEMAND_CENTS[zone] if "On-Demand" in name else 0
        expected[name] = {"gpu_minutes": minutes, "gpu_hours": minutes / 60, "unit_price_cents": cents,
                          "amount_cents": minutes / 60 * cents}

    # Saved after every create so a failed run can be cleaned up with `cleanup`.
    state = {
        "customer_name": f"GPU Reservations Demo {suffix}", "customer_id": None, "alias": alias, "contract_id": None,
        "rate_card_id": None, "reservation_product_id": None, "reservation_product_created": False,
        "metric_ids": {}, "product_ids": {}, "contract_start": iso(contract_start), "invoice_period_start": iso(month_start),
        "events": events, "allocation": allocation, "expected": expected, "invoice": None, "setup_complete": False,
    }
    save(state)

    for name, tags, sql in METRICS:
        state["metric_ids"][name] = call("POST", "/v1/billable-metrics/create", {"name": name, "sql": sql})["data"]["id"]
        save(state)
        print(f"Metric   {name}: {state['metric_ids'][name]}")
    for name, tags, _ in METRICS:
        state["product_ids"][name] = call("POST", "/v1/contract-pricing/products/create", {
            "name": name,
            "type": "usage",
            "billable_metric_id": state["metric_ids"][name],
            "pricing_group_key": ["sku"],
            "presentation_group_key": ["sku", "zone"],
            "quantity_conversion": {"operation": "divide", "conversion_factor": 3600, "name": "GPU-seconds to GPU-hours"},
            "tags": tags,
        })["data"]["id"]
        save(state)
        print(f"Product  {name}: {state['product_ids'][name]}")

    reservation_id = find_subscription_product(RESERVATION_PRODUCT)
    if reservation_id:
        print(f"Product  {RESERVATION_PRODUCT}: {reservation_id} (reused)")
    else:
        reservation_id = call("POST", "/v1/contract-pricing/products/create",
                              {"name": RESERVATION_PRODUCT, "type": "subscription", "tags": ["gpu", "reservation"]})["data"]["id"]
        state["reservation_product_created"] = True
        print(f"Product  {RESERVATION_PRODUCT}: {reservation_id}")
    state["reservation_product_id"] = reservation_id
    save(state)

    rate_card_id = call("POST", "/v1/contract-pricing/rate-cards/create", {
        "name": "GPU Reservations Rate Card",
        "description": "Regional + global GPU reservations with on-demand overflow. Usage in GPU-hours.",
    })["data"]["id"]
    state["rate_card_id"] = rate_card_id
    save(state)
    rates = []
    for name, _, _ in METRICS:
        zone = name.split("— ")[1]
        price = ON_DEMAND_CENTS[zone] if "On-Demand" in name else 0
        rates.append({"product_id": state["product_ids"][name], "starting_at": iso(contract_start), "entitled": True,
                      "rate_type": "FLAT", "price": price, "pricing_group_values": {"sku": SKU}})
    rates.append({"product_id": reservation_id, "starting_at": iso(contract_start), "entitled": True,
                  "rate_type": "FLAT", "price": RESERVATION_FEE_CENTS, "billing_frequency": "MONTHLY"})
    call("POST", "/v1/contract-pricing/rate-cards/addRates", {"rate_card_id": rate_card_id, "rates": rates})
    print(f"RateCard GPU Reservations Rate Card: {rate_card_id} ({len(rates)} rates)")

    state["customer_id"] = call("POST", "/v1/customers", {"name": state["customer_name"], "ingest_aliases": [alias]})["data"]["id"]
    save(state)
    print(f"Customer {state['customer_name']}: {state['customer_id']} (alias {alias})")

    state["contract_id"] = call("POST", "/v1/contracts/create", {
        "customer_id": state["customer_id"],
        "name": "GPU Reservations",
        "starting_at": iso(contract_start),
        "rate_card_id": rate_card_id,
        "usage_statement_schedule": {"frequency": "MONTHLY", "day": "FIRST_OF_MONTH"},
        "subscriptions": [{
            "collection_schedule": "ADVANCE",
            "proration": {"is_prorated": True, "invoice_behavior": "BILL_IMMEDIATELY"},
            "subscription_rate": {"product_id": reservation_id, "billing_frequency": "MONTHLY"},
            "initial_quantity": RESERVATION_QTY,
        }],
    })["data"]["id"]
    save(state)
    print(f"Contract {state['contract_id']}")

    for key, value in RESERVATIONS.items():
        props = {"sku": SKU} if key == "global" else {"sku": SKU, "zone": key}
        call("POST", "/v1/contracts/updateNamedSchedule", {
            "customer_id": state["customer_id"], "contract_id": state["contract_id"],
            "schedule_name": f"{key}-reserved-instance", "properties": props,
            "starting_at": iso(contract_start), "value": value,
        })
        print(f"Schedule {key}-reserved-instance {props} = {value}")

    call("POST", "/v1/ingest", events)
    print(f"Ingested {len(events)} instance events at {events[0]['timestamp']} – {events[-1]['timestamp']}")
    state["setup_complete"] = True
    save(state)
    print(f"State written to {STATE}")


def cleanup():
    """Archive only the objects recorded in the state file (never anything else in the account)."""
    with open(STATE) as f:
        state = json.load(f)
    if state.get("contract_id"):
        print("Contract", call("POST", "/v1/contracts/archive", {"customer_id": state["customer_id"],
              "contract_id": state["contract_id"], "void_invoices": True}, fatal=False) or "archived")
    if state.get("customer_id"):
        call("POST", "/v1/customers/update", {"id": state["customer_id"], "ingest_aliases": []}, fatal=False)
        print("Customer", call("POST", "/v1/customers/archive", {"id": state["customer_id"]}, fatal=False) or "archived")
    if state.get("rate_card_id"):
        print("Rate card", call("POST", "/v1/contract-pricing/rate-cards/archive", {"id": state["rate_card_id"]}, fatal=False) or "archived")
    product_ids = list(state["product_ids"].values())
    if state.get("reservation_product_created"):
        product_ids.append(state["reservation_product_id"])
    failed = []
    for pid in product_ids:
        if "error" in call("POST", "/v1/contract-pricing/products/archive", {"product_id": pid}, fatal=False):
            failed.append(f"product {pid}")
    for mid in state["metric_ids"].values():
        if "error" in call("POST", "/v1/billable-metrics/archive", {"id": mid}, fatal=False):
            failed.append(f"metric {mid}")
    print(f"Archived {len(product_ids)} products and {len(state['metric_ids'])} billable metrics"
          + (f"; FAILED: {', '.join(failed)}" if failed else ""))
    os.rename(STATE, STATE + ".archived")
    print(f"Moved {STATE} to {STATE}.archived")


def verify():
    with open(STATE) as f:
        state = json.load(f)
    if not state.get("setup_complete"):
        sys.exit("STOP: setup did not finish. Run `cleanup` to archive the partial objects, fix the cause, then re-run setup.")
    deadline = time.time() + 300
    while True:
        lines = {}
        for inv in call("GET", f"/v1/customers/{state['customer_id']}/invoices?status=DRAFT").get("data", []):
            if inv["start_timestamp"].startswith(state["invoice_period_start"][:10]):
                lines = {li["name"]: li for li in inv.get("line_items", [])}
                state["invoice"] = {"id": inv["id"], "total_cents": inv["total"], "line_items": list(lines.values())}
        ok = all(n in lines and abs(float(lines[n]["quantity"]) - e["gpu_hours"]) < 1e-9 for n, e in state["expected"].items())
        if ok or time.time() > deadline:
            break
        print("Waiting for usage to rate onto the draft invoice...")
        time.sleep(15)

    print(f"\n{'Line item':30} {'expected hrs':>12} {'invoice hrs':>12} {'invoice $':>10}  result")
    matches = 0
    for name, e in state["expected"].items():
        li = lines.get(name)
        got = float(li["quantity"]) if li else None
        match = got is not None and abs(got - e["gpu_hours"]) < 1e-9
        matches += match
        print(f"{name:30} {e['gpu_hours']:12.6f} {got if got is not None else float('nan'):12.6f} "
              f"{(float(li['total']) / 100) if li else 0:10.4f}  {'MATCH' if match else 'MISMATCH'}")
    fee = lines.get(RESERVATION_PRODUCT)
    fee_ok = bool(fee) and float(fee["quantity"]) == RESERVATION_QTY and float(fee["unit_price"]) == RESERVATION_FEE_CENTS
    print(f"{RESERVATION_PRODUCT:30} {'qty ' + str(RESERVATION_QTY):>12} {('qty ' + str(fee['quantity'])) if fee else '—':>12} "
          f"{(float(fee['total']) / 100) if fee else 0:10.2f}  {'MATCH' if fee_ok else 'MISMATCH'}")
    with open(STATE, "w") as f:
        json.dump(state, f, indent=2)
    print(f"\n{matches}/{len(state['expected'])} usage lines match; reservation fee {'matches' if fee_ok else 'DOES NOT match'}")
    sys.exit(0 if matches == len(state["expected"]) and fee_ok else 1)


def sheet():
    with open(STATE) as f:
        state = json.load(f)
    V = lambda v: {"value": str(v)}
    F = lambda f: {"formula": f}
    fee_usd = RESERVATION_FEE_CENTS / 100

    overview = [
        ["GPU reservations: billing explainer"],
        [f"Metronome customer {state['customer_name']} ({state['alias']}) · contract {state['contract_id']} · GPU Reservations Rate Card"],
        [""],
        ["Reservation (named schedule on contract)", "Properties", "A100s reserved", "Starts"],
        ["us-east-reserved-instance", "sku=A100, zone=us-east", str(RESERVATIONS["us-east"]), state["contract_start"]],
        ["us-west-reserved-instance", "sku=A100, zone=us-west", str(RESERVATIONS["us-west"]), state["contract_start"]],
        ["us-central-reserved-instance", "sku=A100, zone=us-central", str(RESERVATIONS["us-central"]), state["contract_start"]],
        ["global-reserved-instance", "sku=A100", str(RESERVATIONS["global"]), state["contract_start"]],
        [""],
        ["Product", "Rate (USD per GPU-hour)", "Metric output", "Invoice unit"],
        ["GPU On-Demand — us-east", str(ON_DEMAND_CENTS["us-east"] / 100), "GPU-seconds", "÷ 3,600 → GPU-hours"],
        ["GPU On-Demand — us-west", str(ON_DEMAND_CENTS["us-west"] / 100), "GPU-seconds", "÷ 3,600 → GPU-hours"],
        ["GPU On-Demand — us-central", str(ON_DEMAND_CENTS["us-central"] / 100), "GPU-seconds", "÷ 3,600 → GPU-hours"],
        ["GPU Reserved — us-east / us-west / us-central / global", "0", "GPU-seconds", "÷ 3,600 → GPU-hours"],
        [f"{RESERVATION_PRODUCT} (subscription)", f"${fee_usd:,.0f} per GPU per month × {RESERVATION_QTY}", "—", "—"],
        [""],
        ["How each minute is billed"],
        ["1. Every instance event is truncated to its minute and summed per sku + zone: SUM(billable_value) after DATE_TRUNC('minute')."],
        ["2. The zone's own regional reservation covers usage first."],
        ["3. Overflow draws from the shared global pool in a fixed order: us-east → us-west → us-central (highest on-demand rate first)."],
        ["4. Whatever is left bills on-demand at that zone's rate."],
        ["5. Each minute's GPU count × 60 = GPU-seconds (metric output); the product divides by 3,600 → GPU-hours on the invoice. Nothing is rounded until the invoice."],
        [""],
        ["Tabs"],
        ["Events — the 9 instance events as ingested. Allocation — the per-minute waterfall as live formulas. Invoice — computed lines vs. the Metronome draft invoice."],
        ["Edit billable_value on Events (or a reservation above) and Allocation + Invoice recalculate; the result column flags any drift from what Metronome billed."],
    ]

    events = [["transaction_id", "timestamp", "customer_id", "event_type", "sku", "zone", "billable_value", "minute (DATE_TRUNC)"]]
    for e in state["events"]:
        events.append([e["transaction_id"], e["timestamp"], e["customer_id"], e["event_type"], e["properties"]["sku"],
                       e["properties"]["zone"], str(e["properties"]["billable_value"]), ""])
    n = len(state["events"])
    last = n + 1

    ev, al = "Events", "Allocation"
    res_cell = {"us-east": "Overview!$C$5", "us-west": "Overview!$C$6", "us-central": "Overview!$C$7"}
    ops = [{"type": "update_cells", "sheet_title": ev, "start_row": 1, "start_col": 7,
            "rows": [[F(f'=LEFT(B{r},16)&":00Z"')] for r in range(2, last + 1)]}]

    hdr = ["minute (DATE_TRUNC)", "zone", "events_in_minute", "gpus_reported = SUM(billable_value)", "regional_reservation",
           "covered_by_regional = MIN(reported, reservation)", "overflow = reported − regional",
           "global_pool_left (east → west → central)", "covered_by_global = MIN(overflow, pool_left)",
           "billed_on_demand = overflow − global", "explanation"]
    rows = [[V(h) for h in hdr]]
    for k, a in enumerate(state["allocation"]):
        r = k + 2
        pool = "=Overview!$C$8" if a["zone"] == "us-east" else f"=H{r-1}-I{r-1}"
        rows.append([
            V(a["minute"]), V(a["zone"]),
            F(f"=COUNTIFS({ev}!$H$2:$H${last},$A{r},{ev}!$F$2:$F${last},$B{r})"),
            F(f"=SUMIFS({ev}!$G$2:$G${last},{ev}!$H$2:$H${last},$A{r},{ev}!$F$2:$F${last},$B{r})"),
            F(f"={res_cell[a['zone']]}"), F(f"=MIN(D{r},E{r})"), F(f"=D{r}-F{r}"), F(pool),
            F(f"=MIN(G{r},H{r})"), F(f"=G{r}-I{r}"),
            F(f'=D{r}&" reported · regional reservation of "&E{r}&" covers "&F{r}&IF(G{r}=0," · no overflow"," · "&G{r}'
              f'&" overflow · global pool has "&H{r}&" left and covers "&I{r}&" · "&J{r}&" billed on-demand")'),
        ])
    alast = len(state["allocation"]) + 1
    ops.append({"type": "update_cells", "sheet_title": al, "start_row": 0, "start_col": 0, "rows": rows})

    inv_lines = {li["name"]: li for li in (state.get("invoice") or {}).get("line_items", [])}
    ihdr = ["line_item", "gpu_minutes", "gpu_seconds (metric output)", "gpu_hours (÷ 3,600)", "rate_usd_per_gpu_hr",
            "expected_usd", "metronome_invoice_qty", "metronome_invoice_usd", "result"]
    rate_cell = {"us-east": "=Overview!$B$11", "us-west": "=Overview!$B$12", "us-central": "=Overview!$B$13"}
    irows = [[V(h) for h in ihdr]]
    for k, (name, _, _) in enumerate(METRICS[3:] + METRICS[:3]):
        r = k + 2
        zone = name.split("— ")[1]
        if name == "GPU Reserved — global":
            mins = f"=SUM({al}!$I$2:$I${alast})"
        else:
            col = "J" if "On-Demand" in name else "F"
            mins = f'=SUMIFS({al}!${col}$2:${col}${alast},{al}!$B$2:$B${alast},"{zone}")'
        li = inv_lines.get(name)
        irows.append([
            V(name), F(mins), F(f"=B{r}*60"), F(f"=C{r}/3600"), F(rate_cell[zone] if "On-Demand" in name else "=0"),
            F(f"=D{r}*E{r}"),
            F(f"={float(li['quantity'])!r}") if li else V("not on invoice"),
            F(f"={float(li['total']) / 100!r}") if li else V(""),
            F(f'=IF(ABS(D{r}-G{r})<0.000001,"✓ Match","✗ Mismatch")'),
        ])
    fee = inv_lines.get(RESERVATION_PRODUCT)
    irows += [
        [V("")],
        [V("Total GPU-minutes reported by events"), F(f"=SUM({ev}!$G$2:$G${last})")],
        [V("Total GPU-minutes across the 7 lines"), F("=SUM(B2:B8)")],
        [V("Every GPU-minute accounted for exactly once?"), F('=IF(B10=B11,"✓ Yes","✗ No")')],
        [V("")],
        [V(f"{RESERVATION_PRODUCT} (subscription, not usage-derived)"), V(""), V(""), V(""), V(f"{fee_usd:,.0f} per GPU / month"),
         V(""), V(fee["quantity"] if fee else ""), F(f"={float(fee['total']) / 100!r}") if fee else V(""), V("")],
        [V("On-demand total"), V(""), V(""), V(""), V(""), F("=SUM(F6:F8)"), V(""), F("=SUM(H6:H8)"), V("")],
    ]
    ops.append({"type": "update_cells", "sheet_title": "Invoice", "start_row": 0, "start_col": 0, "rows": irows})

    for tab, ncol in [(ev, 8), (al, 11), ("Invoice", 9)]:
        ops.append({"type": "format_cells", "sheet_title": tab, "start_row": 0, "end_row": 1, "start_col": 0, "end_col": ncol,
                    "bold": True, "background_color": "#E8F0FE", "wrap_strategy": "WRAP", "vertical_alignment": "TOP"})
        ops.append({"type": "freeze", "sheet_title": tab, "frozen_row_count": 1})
    ops += [
        {"type": "format_cells", "sheet_title": al, "start_row": 1, "end_row": alast, "start_col": 9, "end_col": 10,
         "bold": True, "background_color": "#EEEBFA"},
        {"type": "format_cells", "sheet_title": "Invoice", "start_row": 1, "end_row": 8, "start_col": 3, "end_col": 4, "number_format": "0.000000"},
        {"type": "format_cells", "sheet_title": "Invoice", "start_row": 1, "end_row": 8, "start_col": 6, "end_col": 7, "number_format": "0.000000"},
        {"type": "format_cells", "sheet_title": "Invoice", "start_row": 1, "end_row": 16, "start_col": 5, "end_col": 6, "number_format": "$0.0000"},
        {"type": "format_cells", "sheet_title": "Invoice", "start_row": 1, "end_row": 16, "start_col": 7, "end_col": 8, "number_format": "$0.0000"},
        {"type": "format_cells", "sheet_title": "Overview", "start_row": 0, "end_row": 1, "start_col": 0, "end_col": 1, "bold": True, "font_size": 14},
        {"type": "format_cells", "sheet_title": "Overview", "start_row": 3, "end_row": 4, "start_col": 0, "end_col": 4, "bold": True, "background_color": "#E8F0FE"},
        {"type": "format_cells", "sheet_title": "Overview", "start_row": 9, "end_row": 10, "start_col": 0, "end_col": 4, "bold": True, "background_color": "#E8F0FE"},
        {"type": "format_cells", "sheet_title": "Overview", "start_row": 16, "end_row": 17, "start_col": 0, "end_col": 1, "bold": True},
        {"type": "format_cells", "sheet_title": "Overview", "start_row": 23, "end_row": 24, "start_col": 0, "end_col": 1, "bold": True},
        {"type": "resize_dimension", "sheet_title": "Overview", "dimension": "COLUMNS", "start_index": 0, "end_index": 1, "pixel_size": 380},
        {"type": "resize_dimension", "sheet_title": "Overview", "dimension": "COLUMNS", "start_index": 1, "end_index": 4, "pixel_size": 220},
        {"type": "resize_dimension", "sheet_title": ev, "dimension": "COLUMNS", "start_index": 0, "end_index": 1, "pixel_size": 420},
        {"type": "resize_dimension", "sheet_title": ev, "dimension": "COLUMNS", "start_index": 1, "end_index": 8, "pixel_size": 170},
        {"type": "resize_dimension", "sheet_title": al, "dimension": "COLUMNS", "start_index": 0, "end_index": 10, "pixel_size": 150},
        {"type": "resize_dimension", "sheet_title": al, "dimension": "COLUMNS", "start_index": 10, "end_index": 11, "pixel_size": 560},
        {"type": "resize_dimension", "sheet_title": "Invoice", "dimension": "COLUMNS", "start_index": 0, "end_index": 1, "pixel_size": 340},
        {"type": "resize_dimension", "sheet_title": "Invoice", "dimension": "COLUMNS", "start_index": 1, "end_index": 9, "pixel_size": 150},
    ]

    payloads = {
        "/tmp/gpu_sheet_title.txt": f"GPU Reservations Billing Explainer — {state['customer_name']}",
        "/tmp/gpu_sheet_overview.json": json.dumps(overview, ensure_ascii=False),
        "/tmp/gpu_sheet_events.json": json.dumps(events, ensure_ascii=False),
        "/tmp/gpu_sheet_ops.json": json.dumps(ops, ensure_ascii=False),
    }
    for path, content in payloads.items():
        with open(path, "w") as f:
            f.write(content)
        print(f"Wrote {path} ({len(content):,} chars)")
    if not state.get("invoice"):
        print("WARNING: no invoice in state — run `verify` first so the Invoice tab has Metronome's numbers.")


if __name__ == "__main__":
    {"setup": setup, "verify": verify, "sheet": sheet, "cleanup": cleanup}[sys.argv[1] if len(sys.argv) > 1 else "setup"]()
```

#### 4.2 Run setup

```bash
METRONOME_API_KEY="<METRONOME_API_KEY>" python3 -I /tmp/gpu_reservations_demo.py setup
```

Before creating anything, setup checks that named schedules are enabled on the account. If they aren't, it stops with `STOP: named schedules are not enabled…`. Report that to the user and stop.

The script prints every ID it creates. It saves them after each step, together with the events and expected results, to `/tmp/gpu_reservations_demo.json`. If it stops with "re-run after …", it's the first of the month before 10:03 UTC; wait and re-run.

If setup fails partway, archive exactly what it created, and nothing else in the account, before re-running:

```bash
METRONOME_API_KEY="<METRONOME_API_KEY>" python3 -I /tmp/gpu_reservations_demo.py cleanup
```

#### 4.3 Verify the invoice

```bash
METRONOME_API_KEY="<METRONOME_API_KEY>" python3 -I /tmp/gpu_reservations_demo.py verify
```

This polls the customer's current-month draft invoice (up to 5 minutes while usage rates) and compares every line to the expected values. **It must end with `7/7 usage lines match; reservation fee matches` and exit 0.** If it doesn't, stop and report the mismatched lines; don't build the sheet.

Expected invoice lines (GPU-hours = GPU-minutes ÷ 60):
- **GPU Reserved — us-east**: 5 GPU-min = 0.083333 hrs, $0
- **GPU Reserved — us-west**: 6 GPU-min = 0.1 hrs, $0
- **GPU Reserved — us-central**: 12 GPU-min = 0.2 hrs, $0
- **GPU Reserved — global**: 6 GPU-min = 0.1 hrs, $0
- **GPU On-Demand — us-east**: 1 GPU-min = 0.016667 hrs × $10 = $0.1667
- **GPU On-Demand — us-west**: 2 GPU-min = 0.033333 hrs × $5 = $0.1667
- **GPU On-Demand — us-central**: 3 GPU-min = 0.05 hrs × $3 = $0.15
- **A100 Reservation**: 8 × $1,000 = $8,000

The 7 usage lines total 35 GPU-minutes, which is exactly the sum of the 9 events.

#### 4.4 Build the Google Sheet

1. Write the sheet payloads (uses the invoice numbers saved by `verify`):
   ```bash
   python3 -I /tmp/gpu_reservations_demo.py sheet
   ```
   This writes `/tmp/gpu_sheet_title.txt`, `/tmp/gpu_sheet_overview.json`, `/tmp/gpu_sheet_events.json` and `/tmp/gpu_sheet_ops.json`. Read each file and pass its contents **verbatim** as the parameter named below.
2. `create_google_drive_sheet` with `title` = contents of `gpu_sheet_title.txt`, `data_json` = contents of `gpu_sheet_overview.json`, `bold_header: false`. Capture `spreadsheet_id`.
3. `format_google_drive_sheet` with `operations_json` = `[{"type":"update_sheet_properties","sheet_title":"Sheet1","title":"Overview"}]`.
4. `add_sheet_to_google_drive_spreadsheet` three times, in this order:
   - `sheet_title: "Events"`, `data_json` = contents of `gpu_sheet_events.json`
   - `sheet_title: "Allocation"` (no data)
   - `sheet_title: "Invoice"` (no data)
5. `format_google_drive_sheet` with `operations_json` = contents of `gpu_sheet_ops.json`. This writes the Allocation and Invoice formulas and applies formatting.
6. **Check the sheet**: `get_google_drive_sheet_in_spreadsheet` with `sheet_id: "Invoice"`.
   - Rows 2–8 (the 7 usage lines) must each end in `✓ Match`.
   - Row 12 must read `✓ Yes`.
   - The `gpu_minutes` column must read 5, 6, 12, 6, 1, 2, 3.
   - If anything shows `✗`, `#REF!`, `#VALUE!` or `#ERROR!`, report it.

The sheet tabs:
- **Overview**: the reservations (cells C5:C8) and on-demand rates (B11:B13) that the formulas read
- **Events**: the 9 events as ingested. Column H truncates each timestamp to its minute.
- **Allocation**: one row per zone per minute, using `COUNTIFS`/`SUMIFS` over Events, then `MIN` for regional coverage, the global pool carried east → west → central, and on-demand. It also has a plain-English explanation column.
- **Invoice**: GPU-minutes → GPU-seconds → GPU-hours per line, the expected amount, and Metronome's invoice quantity and amount, with a Match check. It also checks that every GPU-minute is counted exactly once.

You can edit a `billable_value` on Events, or a reservation on Overview, and everything recalculates. The Match column then shows how far the edit is from what Metronome actually billed.

**Verification**: 7 billable metrics, 8 products, 1 rate card with 8 rates, 1 customer with a contract and 4 named schedules, 9 events, `verify` at 7/7 plus the reservation fee, and a Google Sheet whose Invoice tab is all `✓ Match`.

---

## Step 5: Report results

After generation, summarize what was created:
- Count of billable metrics, products, rate cards, rates added
- Customers and contracts (Infra SaaS)
- Package templates and customer/contract IDs (Hybrid)
- Customer/contract IDs, ingest alias, `verify` result, and the Google Sheet link (GPU Reservations)
- Any errors encountered

If errors occurred, surface them clearly and suggest clearing the sandbox and re-running. For GPU Reservations, suggest `cleanup` instead of a full sandbox clear. It archives only the objects that run created.

---

## Talking points by demo type

**AI Platform**
- One rate card covers every model and tier
- Batch tier is half price — useful for async/bulk workloads
- Presentation keys let users slice usage by team, project, or upstream provider without changing the rate card
- MTok conversion is handled by Metronome — customers see clean units, not raw token counts

**Infra SaaS**
- Cloud provider + region + cluster type live in one rate card
- The 3-year advanced cluster deal shows escalating commits and a discount overlay
- Usage is already ingested — jump straight to burn-down and real-time ledger
- Paygo customer shows free trial credit → pay-as-you-go transition

**Hybrid Seat + Usage**
- Seat tiers with included AI credits — overage billed at usage rates
- Annual and monthly packaging in the same rate card; no duplication
- The 0.8× multiplier shows contract-level discounting without touching the rate card
- `credit_type_conversions` bridges the seat and usage currencies transparently

**GPU Reservations**
- Usage events are raw and immutable. They report GPUs running per zone per minute and never say "reserved" or "on-demand". That split is derived from the contract at rating time.
- Reservations are named schedules on the contract, so a mid-term change (e.g. 4 → 6 GPUs from the 15th) is one API call, and Metronome re-rates from that timestamp.
- Regional and global reservations stack in SQL: regional first, then a shared pool spent east → west → central, which is the most expensive on-demand rate first.
- The $0 reserved lines show customers how much of their reservation they used. Reserved + global + on-demand always equals total usage (35 GPU-minutes here).
- Precision holds until the invoice. 1 GPU-minute in us-east bills 16.67¢; nothing is rounded mid-calculation.
- Walk through the sheet tab by tab: Events → Allocation → Invoice. Then edit an event live to show the recalculation.
