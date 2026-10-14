# Metronome Demo Generator

Use this skill to spin up a Metronome demo environment. It makes direct API calls to `https://api.metronome.com/v1` — no local app required.

Invoke with `/metronome-demo` or when the user says "create a Metronome demo", "run the demo generator", "generate a Metronome environment".

---

## Step 1: Ask which demo to create

Use `AskUserQuestion` to ask:

**Question**: "Which demo type do you want to generate?"
**Options**:
1. **AI Platform** — Catalog only (6 billable metrics, 6 usage products, AI Platform Standard Rate Card with per-model/per-direction pricing). No customers or usage events. Best for AI API / developer platform prospects.
2. **Infra SaaS** — Full environment (4 metrics, 7 products, Standard Rate Card with multi-cloud pricing, 3 customers with contracts, synthetic hourly usage already ingested). Best for cloud infra / DevOps prospects.
3. **Hybrid Seat + Usage** — AI Platform catalog plus seat subscription products, hybrid rate card with AI Credits, 6 package templates, and an example contract. Requires an "AI Credits" custom pricing unit UUID from the Metronome Dashboard. Best for SaaS prospects adding AI billing.

---

## Step 2: Collect inputs

**All demo types**:
- Metronome API key (if not already known from context or a previous message this session)
- Whether to clear the sandbox first (recommend yes if re-running)

**Hybrid only**:
- AI Credits custom pricing unit UUID — they create this in the Metronome Dashboard under Offering → Custom Pricing Units (1 AI Credit = $0.01 USD), then retrieve it via `GET https://api.metronome.com/v1/credit-types/list` or copy from the Dashboard.

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

Fixed products (2):
```json
{"name": "Free Trial Credits", "type": "fixed"}
{"name": "Prepaid Commit", "type": "fixed"}
```

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

Run with: `python3 -I /tmp/infra_usage.py`

**Verification**: 4 billable metrics, 7 products, 1 rate card, 3 customers with contracts and usage events.

---

### Hybrid Seat + Usage

#### 4.1 Ensure fixed products
Same as AI Platform step 4.3. You need the `Credit` product ID specifically for recurring credits.

#### 4.2–4.4 Create AI Platform catalog
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
  "name": "Hybrid Seat+ Usage Rate Card",
  "description": "Hybrid Seat+ Usage: token usage from ai-pricebook priced in AI Credits; 1 AI Credit = $0.01 USD.",
  "fiat_credit_type_id": "2714e483-4ff1-48e4-9e25-ac732e8f24f2",
  "credit_type_conversions": [{
    "custom_credit_type_id": "<AI_CREDITS_UUID>",
    "fiat_per_custom_credit": 1
  }]
}
```

Capture: `hybrid_rate_card_id`.

#### 4.7 Add AI usage rates (with credit_type_id)

Same as AI Platform step 4.5, but add `"credit_type_id": "<AI_CREDITS_UUID>"` to every rate object. Price values stay as floats (no cents conversion).

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
      "credit_type_id": "<AI_CREDITS_UUID>"
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
  -d '{"name": "enterprise customer", "ingest_aliases": ["hybrid-seat-demo-<RANDOM_8_CHARS>"]}'
```

Contract (SEAT_BASED, Better + Best subscriptions, recurring AI Credits, 20% discount):

Use `starting_at` = first day of current month at 00:00:00Z.

Generate unique UUIDs for `BETTER_TMP_ID` and `BEST_TMP_ID`.

```json
{
  "customer_id": "<CUSTOMER_ID>",
  "starting_at": "<start_date>",
  "name": "Hybrid Seat+ Usage example contract",
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
      "name": "include credits for better subscriptions",
      "product_id": "<Credit fixed product id>",
      "starting_at": "<start_date>",
      "priority": 1,
      "commit_duration": {"value": 1, "unit": "PERIODS"},
      "recurrence_frequency": "MONTHLY",
      "access_amount": {"credit_type_id": "<AI_CREDITS_UUID>", "unit_price": 1200},
      "subscription_config": {
        "subscription_id": "<BETTER_TMP_ID>",
        "allocation": "INDIVIDUAL",
        "apply_seat_increase_config": {"is_prorated": false}
      }
    },
    {
      "name": "include credits for best subscriptions",
      "product_id": "<Credit fixed product id>",
      "starting_at": "<start_date>",
      "priority": 2,
      "commit_duration": {"value": 1, "unit": "PERIODS"},
      "recurrence_frequency": "MONTHLY",
      "access_amount": {"credit_type_id": "<AI_CREDITS_UUID>", "unit_price": 2500},
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

---

## Step 5: Report results

After generation, summarize what was created:
- Count of billable metrics, products, rate cards, rates added
- Customers and contracts (Infra SaaS)
- Package templates and customer/contract IDs (Hybrid)
- Any errors encountered

If errors occurred, surface them clearly and suggest clearing the sandbox and re-running.

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
