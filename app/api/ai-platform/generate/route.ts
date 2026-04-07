import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const METRONOME_API_URL = 'https://api.metronome.com/v1'
const AI_CSV_FILE_PATH = join(process.cwd(), 'data', 'ai-pricebook.csv')
const AI_PLATFORM_RATE_CARD_NAME = 'AI Platform Standard Rate Card'

/** Same shape as Infra SaaS billable metrics (see app/api/infra-saas/generate/route.ts). */
interface BillableMetric {
  name: string
  event_type_filter: { in_values: string[] }
  property_filters: { name: string; exists?: boolean; in_values?: string[] }[]
  aggregation_type: string
  aggregation_key: string
  group_keys: string[][]
}

interface Product {
  name: string
  type: 'usage' | 'fixed' | 'composite'
  pricing_group_key?: string[]
  presentation_group_key?: string[]
  quantity_conversion?: {
    conversion_factor: number
    operation: 'divide' | 'multiply' | 'DIVIDE' | 'MULTIPLY'
    name?: string
  }
  tags?: string[]
  billable_metric_id?: string
}

interface RateCard {
  name: string
  aliases?: { name: string }[]
}

interface Rate {
  product_id: string
  effective_at: string
  pricing_group_values: Record<string, string>
  starting_at: string
  entitled: boolean
  rate_type: string
  price: number
  tiers?: Array<{ price: number; size?: number }>
}

/**
 * group_keys: seven dimensions per metric (`api_product` scopes the commercial API; the rest are
 * pricing + invoice presentation). Property filters use exists: true on dimensions; `api_product`
 * adds in_values. Order matches Infra: aggregated quantity first, then dimensions.
 * Usage products narrow `pricing_group_key` to model + tier and put provider/org on presentation.
 */
const billableMetrics: BillableMetric[] = [
  {
    name: 'Code Assist - Input Tokens',
    event_type_filter: { in_values: ['ai_platform.usage'] },
    property_filters: [
      { name: 'input_tokens', exists: true },
      { name: 'api_product', exists: true, in_values: ['code_assist'] },
      { name: 'upstream_provider', exists: true },
      { name: 'model', exists: true },
      { name: 'processing_tier', exists: true },
      { name: 'user_id', exists: true },
      { name: 'team_id', exists: true },
      { name: 'project_id', exists: true },
    ],
    aggregation_type: 'sum',
    aggregation_key: 'input_tokens',
    group_keys: [
      [
        'api_product',
        'upstream_provider',
        'model',
        'processing_tier',
        'user_id',
        'team_id',
        'project_id',
      ],
    ],
  },
  {
    name: 'Code Assist - Output Tokens',
    event_type_filter: { in_values: ['ai_platform.usage'] },
    property_filters: [
      { name: 'output_tokens', exists: true },
      { name: 'api_product', exists: true, in_values: ['code_assist'] },
      { name: 'upstream_provider', exists: true },
      { name: 'model', exists: true },
      { name: 'processing_tier', exists: true },
      { name: 'user_id', exists: true },
      { name: 'team_id', exists: true },
      { name: 'project_id', exists: true },
    ],
    aggregation_type: 'sum',
    aggregation_key: 'output_tokens',
    group_keys: [
      [
        'api_product',
        'upstream_provider',
        'model',
        'processing_tier',
        'user_id',
        'team_id',
        'project_id',
      ],
    ],
  },
  {
    name: 'Chat - Input Tokens',
    event_type_filter: { in_values: ['ai_platform.usage'] },
    property_filters: [
      { name: 'input_tokens', exists: true },
      { name: 'api_product', exists: true, in_values: ['chat'] },
      { name: 'upstream_provider', exists: true },
      { name: 'model', exists: true },
      { name: 'processing_tier', exists: true },
      { name: 'user_id', exists: true },
      { name: 'team_id', exists: true },
      { name: 'project_id', exists: true },
    ],
    aggregation_type: 'sum',
    aggregation_key: 'input_tokens',
    group_keys: [
      [
        'api_product',
        'upstream_provider',
        'model',
        'processing_tier',
        'user_id',
        'team_id',
        'project_id',
      ],
    ],
  },
  {
    name: 'Chat - Output Tokens',
    event_type_filter: { in_values: ['ai_platform.usage'] },
    property_filters: [
      { name: 'output_tokens', exists: true },
      { name: 'api_product', exists: true, in_values: ['chat'] },
      { name: 'upstream_provider', exists: true },
      { name: 'model', exists: true },
      { name: 'processing_tier', exists: true },
      { name: 'user_id', exists: true },
      { name: 'team_id', exists: true },
      { name: 'project_id', exists: true },
    ],
    aggregation_type: 'sum',
    aggregation_key: 'output_tokens',
    group_keys: [
      [
        'api_product',
        'upstream_provider',
        'model',
        'processing_tier',
        'user_id',
        'team_id',
        'project_id',
      ],
    ],
  },
  {
    name: 'Voice - Input Tokens',
    event_type_filter: { in_values: ['ai_platform.usage'] },
    property_filters: [
      { name: 'input_tokens', exists: true },
      { name: 'api_product', exists: true, in_values: ['realtime_voice'] },
      { name: 'upstream_provider', exists: true },
      { name: 'model', exists: true },
      { name: 'processing_tier', exists: true },
      { name: 'user_id', exists: true },
      { name: 'team_id', exists: true },
      { name: 'project_id', exists: true },
    ],
    aggregation_type: 'sum',
    aggregation_key: 'input_tokens',
    group_keys: [
      [
        'api_product',
        'upstream_provider',
        'model',
        'processing_tier',
        'user_id',
        'team_id',
        'project_id',
      ],
    ],
  },
  {
    name: 'Voice - Output Tokens',
    event_type_filter: { in_values: ['ai_platform.usage'] },
    property_filters: [
      { name: 'output_tokens', exists: true },
      { name: 'api_product', exists: true, in_values: ['realtime_voice'] },
      { name: 'upstream_provider', exists: true },
      { name: 'model', exists: true },
      { name: 'processing_tier', exists: true },
      { name: 'user_id', exists: true },
      { name: 'team_id', exists: true },
      { name: 'project_id', exists: true },
    ],
    aggregation_type: 'sum',
    aggregation_key: 'output_tokens',
    group_keys: [
      [
        'api_product',
        'upstream_provider',
        'model',
        'processing_tier',
        'user_id',
        'team_id',
        'project_id',
      ],
    ],
  },
]

/** Rates vary by model + tier; invoice rows group by provider and org dimensions. */
const PRICING_GROUP_KEY = ['model', 'processing_tier'] as const
const PRESENTATION_GROUP_KEY = ['upstream_provider', 'user_id', 'team_id', 'project_id'] as const

/** Event quantities are token counts; CSV `price` is $/MTok → divide by 1e6 so one rate unit = 1M tokens. */
const TOKEN_TO_MILLION_TOKENS_CONVERSION: NonNullable<Product['quantity_conversion']> = {
  operation: 'divide',
  conversion_factor: 1_000_000,
  name: 'tokens to million tokens',
}

const products: Product[] = billableMetrics.map((m) => ({
  name: m.name,
  type: 'usage' as const,
  pricing_group_key: [...PRICING_GROUP_KEY],
  presentation_group_key: [...PRESENTATION_GROUP_KEY],
  quantity_conversion: TOKEN_TO_MILLION_TOKENS_CONVERSION,
  tags: ['all'],
}))

const rateCards: RateCard[] = [{ name: AI_PLATFORM_RATE_CARD_NAME }]

/**
 * Fixed products for AI Platform (Metronome-style catalog). Matched by exact name
 * on active FIXED rows from products/list — not by id.
 */
const FIXED_PRODUCT_NAMES = [
  'Prepaid Commit',
  'Postpaid Commit',
  'Credit',
  'Trial Credit',
  'SLA Credit',
] as const

/** Active, non-archived FIXED products: `current.name` -> id */
async function listActiveFixedProductNameToId(apiKey: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  let nextPage: string | null = null

  while (true) {
    const nextPageParam: string = nextPage ? `&next_page=${nextPage}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/contract-pricing/products/list?limit=100${nextPageParam}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to list products: ${response.status} ${text}`)
    }

    const json = await response.json()
    for (const p of json.data || []) {
      if (p.archived_at != null) continue
      if (p.type !== 'FIXED') continue
      const name = p.current?.name as string | undefined
      if (!name) continue
      if (map[name] === undefined) {
        map[name] = p.id
      }
    }

    nextPage = json.next_page ?? null
    if (!nextPage) break
  }

  return map
}

async function ensureFixedProducts(
  apiKey: string
): Promise<{ ids: Record<string, string>; created: string[] }> {
  const existing = await listActiveFixedProductNameToId(apiKey)
  /** Only the five catalog names (not every FIXED product in the account). */
  const ids: Record<string, string> = {}
  const created: string[] = []
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/products/create`

  for (const name of FIXED_PRODUCT_NAMES) {
    const foundId = existing[name]
    if (foundId) {
      ids[name] = foundId
      continue
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, type: 'fixed' }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create fixed product "${name}": ${JSON.stringify(data)}`)
    }

    ids[name] = data.data.id
    created.push(name)
  }

  return { ids, created }
}

async function createRateCards(apiKey: string): Promise<Record<string, string>> {
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/rate-cards/create`
  const rateCardIds: Record<string, string> = {}

  for (const rateCard of rateCards) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rateCard),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create rate card ${rateCard.name}: ${JSON.stringify(data)}`)
    }

    rateCardIds[rateCard.name] = data.data.id
  }

  return rateCardIds
}

function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

async function fetchAllProductsForRates(apiKey: string): Promise<Record<string, { id: string }>> {
  const productHash: Record<string, { id: string }> = {}
  let nextPage: string | null = null

  while (true) {
    const nextPageParam: string = nextPage ? `&next_page=${nextPage}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/contract-pricing/products/list?limit=100${nextPageParam}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }

    const responseJson = await response.json()
    const responseData = responseJson.data

    for (const product of responseData) {
      const current = product.current
      productHash[current.name] = {
        id: product.id,
      }
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return productHash
}

/**
 * CSV `price` is USD per 1M tokens; product quantity_conversion yields millions of tokens per line,
 * so `price` is passed as cents per million tokens (same ×100 pattern as Infra dollars-per-unit → cents).
 */
function processAiPricebookRates(
  csvData: { headers: string[]; rows: Record<string, string>[] },
  productHash: Record<string, { id: string }>,
  defaultEffectiveAt: string
): Rate[] {
  const requiredFields = ['product_name', 'price']
  const knownFields = ['product_name', 'price', 'effective_at', 'entitled', 'rate_type']

  for (const field of requiredFields) {
    if (!csvData.headers.includes(field)) {
      throw new Error(`${field} field required in CSV`)
    }
  }

  const pricingGroupKeyFields = csvData.headers.filter((field) => !knownFields.includes(field))

  const rates: Rate[] = []

  for (const row of csvData.rows) {
    const productName = row['product_name']
    const priceStr = row['price']

    if (!productName || !priceStr) {
      continue
    }

    if (!productHash[productName]) {
      continue
    }

    const productId = productHash[productName].id
    const price = Math.round(parseFloat(priceStr) * 100)

    const effectiveAt = row['effective_at'] || defaultEffectiveAt
    if (!effectiveAt) {
      throw new Error('effective_at must be provided in CSV or as default_effective_at parameter')
    }

    const entitled = row['entitled'] === 'true' || row['entitled'] === '' || !row['entitled']
    const rateType = row['rate_type'] || 'flat'

    const pricingGroupValues: Record<string, string> = {}
    for (const key of pricingGroupKeyFields) {
      if (row[key]) {
        pricingGroupValues[key] = row[key]
      }
    }

    rates.push({
      product_id: productId,
      effective_at: effectiveAt,
      pricing_group_values: pricingGroupValues,
      starting_at: effectiveAt,
      entitled,
      rate_type: rateType,
      price,
    })
  }

  return rates
}

async function addRatesToRateCard(apiKey: string, rateCardId: string, rates: Rate[]) {
  const batchSize = 100
  let totalSent = 0
  const errors: string[] = []

  for (let i = 0; i < rates.length; i += batchSize) {
    const batch = rates.slice(i, i + batchSize)

    const response = await fetch(`${METRONOME_API_URL}/contract-pricing/rate-cards/addRates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rate_card_id: rateCardId,
        rates: batch,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${response.status} - ${errorText}`)
    } else {
      totalSent += batch.length
    }
  }

  return { totalSent, errors }
}

async function addAiRatesFromCSV(apiKey: string, rateCardId: string): Promise<{ ratesSent: number; errors: string[] }> {
  const currentYear = new Date().getFullYear()
  const defaultEffectiveAt = `${currentYear}-01-01T00:00:00Z`

  const csvText = readFileSync(AI_CSV_FILE_PATH, 'utf-8')
  const csvData = parseCSV(csvText)
  const productHash = await fetchAllProductsForRates(apiKey)
  const rates = processAiPricebookRates(csvData, productHash, defaultEffectiveAt)

  if (rates.length === 0) {
    throw new Error('No valid rates found in CSV')
  }

  const result = await addRatesToRateCard(apiKey, rateCardId, rates)

  return { ratesSent: result.totalSent, errors: result.errors }
}

async function createBillableMetrics(apiKey: string): Promise<Record<string, string>> {
  const metricIds: Record<string, string> = {}
  const apiUrl = `${METRONOME_API_URL}/billable-metrics/create`

  for (const metric of billableMetrics) {
    const payload = {
      name: metric.name,
      event_type_filter: metric.event_type_filter,
      property_filters: metric.property_filters,
      aggregation_type: metric.aggregation_type,
      aggregation_key: metric.aggregation_key,
      group_keys: metric.group_keys,
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`Failed to create ${metric.name}:`, data)
      throw new Error(`Failed to create billable metric ${metric.name}: ${JSON.stringify(data)}`)
    }

    metricIds[metric.name] = data.data.id
  }

  return metricIds
}

async function createProducts(apiKey: string, metricIds: Record<string, string>): Promise<Record<string, string>> {
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/products/create`
  const productIds: Record<string, string> = {}

  for (const product of products) {
    const productJson: Record<string, unknown> = { ...product }

    if (product.type === 'usage') {
      productJson.billable_metric_id = metricIds[product.name]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productJson),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create product ${product.name}: ${JSON.stringify(data)}`)
    }

    productIds[product.name] = data.data.id
  }

  return productIds
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    const results: {
      fixedProducts: Record<string, string>
      fixedProductsCreated: string[]
      billableMetrics: Record<string, string>
      products: Record<string, string>
      rateCards: Record<string, string>
      ratesAdded?: string
      errors: string[]
    } = {
      fixedProducts: {},
      fixedProductsCreated: [],
      billableMetrics: {},
      products: {},
      rateCards: {},
      errors: [],
    }

    try {
      const fixed = await ensureFixedProducts(apiKey)
      results.fixedProducts = fixed.ids
      results.fixedProductsCreated = fixed.created
    } catch (error) {
      results.errors.push(`Fixed products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      results.billableMetrics = await createBillableMetrics(apiKey)
    } catch (error) {
      results.errors.push(`Billable metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      if (Object.keys(results.billableMetrics).length > 0) {
        results.products = await createProducts(apiKey, results.billableMetrics)
      }
    } catch (error) {
      results.errors.push(`Products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      results.rateCards = await createRateCards(apiKey)
    } catch (error) {
      results.errors.push(`Rate cards: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      if (Object.keys(results.rateCards).length > 0 && Object.keys(results.products).length > 0) {
        const rateCardId = results.rateCards[AI_PLATFORM_RATE_CARD_NAME]
        if (rateCardId) {
          const ratesResult = await addAiRatesFromCSV(apiKey, rateCardId)
          results.ratesAdded = `Successfully added ${ratesResult.ratesSent} rates to rate card "${AI_PLATFORM_RATE_CARD_NAME}"`
          if (ratesResult.errors.length > 0) {
            results.errors.push(`Rates: ${ratesResult.errors.join('; ')}`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`Rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      message:
        results.errors.length === 0
          ? 'AI Platform demo objects (metrics, products, rate card, and CSV rates) created successfully'
          : 'Some objects were created, but errors occurred',
    })
  } catch (error) {
    console.error('Error generating AI Platform demo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate demo' },
      { status: 500 }
    )
  }
}
