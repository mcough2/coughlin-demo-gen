import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { join } from 'path'

export const METRONOME_API_URL = 'https://api.metronome.com/v1'
export const AI_CSV_FILE_PATH = join(process.cwd(), 'data', 'ai-pricebook.csv')
export const AI_PLATFORM_RATE_CARD_NAME = 'AI Platform Standard Rate Card'

/** Default USD (cents) fiat credit type in Metronome. */
export const FIAT_USD_CENTS_CREDIT_TYPE_ID = '2714e483-4ff1-48e4-9e25-ac732e8f24f2'

/**
 * On a rate card: 1 AI Credit = $0.01 USD ⇒ 1 credit = 1 USD cent when fiat is USD (cents).
 */
export const FIAT_CENTS_PER_AI_CREDIT = 1

export const HYBRID_RATE_CARD_NAME = 'Hybrid Seat+ Usage Rate Card'

/**
 * Reference contract created with the hybrid seat + recurring AI Credits pattern
 * (Better + Best seat subscriptions with matching recurring credits; SEAT_BASED).
 */
export const HYBRID_EXAMPLE_CONTRACT_ID = '5a48050e-a5f0-460b-b434-d381ed8fccd0'

/** Cross-references `subscription_config.subscription_id` in the same contracts/create payload. */
export const HYBRID_TMP_SUBSCRIPTION_GOOD = 'tmpsub-hybrid-good'
export const HYBRID_TMP_SUBSCRIPTION_BETTER = 'tmpsub-hybrid-better'
export const HYBRID_TMP_SUBSCRIPTION_BEST = 'tmpsub-hybrid-best'

export const HYBRID_GOOD_INITIAL_SEAT_USER_IDS: readonly string[] = [
  'alex_001',
  'jamie_002',
  'taylor_003',
  'morgan_004',
  'casey_005',
  'riley_006',
  'jordan_007',
  'avery_008',
  'quinn_009',
  'blake_010',
]

/** Better tier enterprise contract: 10 seats (quantity = len(initial_seat_ids)) */
export const HYBRID_BETTER_INITIAL_SEAT_USER_IDS: readonly string[] = [
  'alex_001',
  'jamie_002',
  'taylor_003',
  'morgan_004',
  'casey_005',
  'riley_006',
  'jordan_007',
  'avery_008',
  'quinn_009',
  'blake_010',
]

/** Best tier enterprise contract: 2 seats (quantity = len(initial_seat_ids)) */
export const HYBRID_BEST_INITIAL_SEAT_USER_IDS: readonly string[] = ['dakota_011', 'skyler_012']

/** AI Credits per seat per month for Better subscription recurring credit */
const HYBRID_RECURRING_CREDIT_BETTER_UNIT_PRICE = 1200
/** AI Credits per seat per month for Best subscription recurring credit */
const HYBRID_RECURRING_CREDIT_BEST_UNIT_PRICE = 2500

/** Seat SKUs for Hybrid (subscription products; rates in USD cents on the rate card). */
export const HYBRID_SEAT_SUBSCRIPTION_DEFS: ReadonlyArray<{ name: string; tags: string[] }> = [
  { name: 'Good Subscription', tags: ['seat', 'hybrid'] },
  { name: 'Better Subscription', tags: ['seat', 'hybrid'] },
  { name: 'Best Subscription', tags: ['seat', 'hybrid'] },
]

/** List prices in USD cents per seat per period */
export const HYBRID_SEAT_SUBSCRIPTION_LIST_RATES: ReadonlyArray<{
  productName: string
  billing_frequency: 'MONTHLY' | 'ANNUAL'
  price: number
}> = [
  { productName: 'Good Subscription', billing_frequency: 'MONTHLY', price: 1000 },
  { productName: 'Good Subscription', billing_frequency: 'ANNUAL', price: 10000 },
  { productName: 'Better Subscription', billing_frequency: 'MONTHLY', price: 2000 },
  { productName: 'Better Subscription', billing_frequency: 'ANNUAL', price: 20000 },
  { productName: 'Best Subscription', billing_frequency: 'MONTHLY', price: 3000 },
  { productName: 'Best Subscription', billing_frequency: 'ANNUAL', price: 30000 },
]

/**
 * Six package templates for the hybrid rate card (from live Metronome packages):
 * Good / Better / Best × Monthly / Annual. Each includes one subscription (quantity)
 * and one recurring credit on the fixed **Credit** product using the account AI Credits
 * `credit_type_id`. `product_id` for credits is resolved at runtime from {@link ensureFixedProducts}.
 */
export interface HybridPackageTemplateSpec {
  name: string
  subscriptionProductName: 'Good Subscription' | 'Better Subscription' | 'Best Subscription'
  billingFrequency: 'MONTHLY' | 'ANNUAL'
  recurringCreditDisplayName: string
  /** AI Credits per period (custom credit unit) */
  recurringCreditUnitPrice: number
  /** Annual tiers: credits still accrue monthly */
  recurringCreditRecurrenceFrequency?: 'MONTHLY'
}

export const HYBRID_PACKAGE_TEMPLATE_SPECS: ReadonlyArray<HybridPackageTemplateSpec> = [
  {
    name: 'Good (Monthly)',
    subscriptionProductName: 'Good Subscription',
    billingFrequency: 'MONTHLY',
    recurringCreditDisplayName: 'Include AI Credits for Good Subscription',
    recurringCreditUnitPrice: 500,
  },
  {
    name: 'Good (Annual)',
    subscriptionProductName: 'Good Subscription',
    billingFrequency: 'ANNUAL',
    recurringCreditDisplayName: 'Included AI Credits for Good Subscription',
    recurringCreditUnitPrice: 500,
    recurringCreditRecurrenceFrequency: 'MONTHLY',
  },
  {
    name: 'Better (Monthly)',
    subscriptionProductName: 'Better Subscription',
    billingFrequency: 'MONTHLY',
    recurringCreditDisplayName: 'Included AI Credits for Better Subscription',
    recurringCreditUnitPrice: 1000,
  },
  {
    name: 'Better (Annual)',
    subscriptionProductName: 'Better Subscription',
    billingFrequency: 'ANNUAL',
    recurringCreditDisplayName: 'Included AI Credits for Better Subscription',
    recurringCreditUnitPrice: 1000,
    recurringCreditRecurrenceFrequency: 'MONTHLY',
  },
  {
    name: 'Best (Monthly)',
    subscriptionProductName: 'Best Subscription',
    billingFrequency: 'MONTHLY',
    recurringCreditDisplayName: 'Included AI Credits for Best Subscription',
    recurringCreditUnitPrice: 2000,
  },
  {
    name: 'Best (Annual)',
    subscriptionProductName: 'Best Subscription',
    billingFrequency: 'ANNUAL',
    recurringCreditDisplayName: 'Included AI Credits for Best Subscription',
    recurringCreditUnitPrice: 2000,
    recurringCreditRecurrenceFrequency: 'MONTHLY',
  },
]

/** Same shape as Infra SaaS billable metrics (see app/api/infra-saas/generate/route.ts). */
export interface BillableMetric {
  name: string
  event_type_filter: { in_values: string[] }
  property_filters: { name: string; exists?: boolean; in_values?: string[] }[]
  aggregation_type: string
  aggregation_key: string
  group_keys: string[][]
}

export interface Product {
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

export interface RateCard {
  name: string
  aliases?: { name: string }[]
}

export interface Rate {
  product_id: string
  effective_at: string
  pricing_group_values: Record<string, string>
  starting_at: string
  entitled: boolean
  rate_type: string
  price: number
  tiers?: Array<{ price: number; size?: number }>
  credit_type_id?: string
  /** Subscription seat rates (USD on rate card) */
  billing_frequency?: string
}

export const billableMetrics: BillableMetric[] = [
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

const PRICING_GROUP_KEY = ['model', 'processing_tier'] as const
const PRESENTATION_GROUP_KEY = ['upstream_provider', 'user_id', 'team_id', 'project_id'] as const

const TOKEN_TO_MILLION_TOKENS_CONVERSION: NonNullable<Product['quantity_conversion']> = {
  operation: 'divide',
  conversion_factor: 1_000_000,
  name: 'tokens to million tokens',
}

export const products: Product[] = billableMetrics.map((m) => ({
  name: m.name,
  type: 'usage' as const,
  pricing_group_key: [...PRICING_GROUP_KEY],
  presentation_group_key: [...PRESENTATION_GROUP_KEY],
  quantity_conversion: TOKEN_TO_MILLION_TOKENS_CONVERSION,
  tags: ['all'],
}))

export const AI_PLATFORM_RATE_CARDS: RateCard[] = [{ name: AI_PLATFORM_RATE_CARD_NAME }]

export const FIXED_PRODUCT_NAMES = [
  'Prepaid Commit',
  'Postpaid Commit',
  'Credit',
  'Trial Credit',
  'SLA Credit',
] as const

export async function listActiveFixedProductNameToId(apiKey: string): Promise<Record<string, string>> {
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

export async function ensureFixedProducts(
  apiKey: string
): Promise<{ ids: Record<string, string>; created: string[] }> {
  const existing = await listActiveFixedProductNameToId(apiKey)
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

export async function createRateCards(apiKey: string, rateCardDefinitions: RateCard[]): Promise<Record<string, string>> {
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/rate-cards/create`
  const rateCardIds: Record<string, string> = {}

  for (const rateCard of rateCardDefinitions) {
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

/**
 * Rate card with USD (cents) fiat + AI Credits conversion: 1 credit = $0.01 USD.
 */
export async function createHybridSeatUsageRateCard(
  apiKey: string,
  customPricingUnitId: string
): Promise<Record<string, string>> {
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/rate-cards/create`
  const body = {
    name: HYBRID_RATE_CARD_NAME,
    description:
      'Hybrid Seat+ Usage: token usage from ai-pricebook priced in AI Credits; 1 AI Credit = $0.01 USD.',
    fiat_credit_type_id: FIAT_USD_CENTS_CREDIT_TYPE_ID,
    credit_type_conversions: [
      {
        custom_credit_type_id: customPricingUnitId,
        fiat_per_custom_credit: FIAT_CENTS_PER_AI_CREDIT,
      },
    ],
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to create hybrid rate card: ${JSON.stringify(data)}`)
  }

  return { [HYBRID_RATE_CARD_NAME]: data.data.id }
}

export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
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

export async function fetchAllProductsForRates(apiKey: string): Promise<Record<string, { id: string }>> {
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
 * CSV `price` is USD per 1M tokens. List rate is that value scaled to two decimals: `(price × 100) / 100`
 * (i.e. previous cent-scale `round(price × 100)` divided by 100). quantity_conversion on products still
 * converts raw tokens to millions. When `usageCreditTypeId` is set (hybrid), list rates use that credit type.
 */
export function processAiPricebookRates(
  csvData: { headers: string[]; rows: Record<string, string>[] },
  productHash: Record<string, { id: string }>,
  defaultEffectiveAt: string,
  usageCreditTypeId?: string
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
    const price = Math.round(parseFloat(priceStr) * 100) / 100

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

    const r: Rate = {
      product_id: productId,
      effective_at: effectiveAt,
      pricing_group_values: pricingGroupValues,
      starting_at: effectiveAt,
      entitled,
      rate_type: rateType,
      price,
    }
    if (usageCreditTypeId) {
      r.credit_type_id = usageCreditTypeId
    }
    rates.push(r)
  }

  return rates
}

export async function addRatesToRateCard(apiKey: string, rateCardId: string, rates: Rate[]) {
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

export async function addAiRatesFromCSV(
  apiKey: string,
  rateCardId: string,
  usageCreditTypeId?: string
): Promise<{ ratesSent: number; errors: string[] }> {
  const currentYear = new Date().getFullYear()
  const defaultEffectiveAt = `${currentYear}-01-01T00:00:00Z`

  const csvText = readFileSync(AI_CSV_FILE_PATH, 'utf-8')
  const csvData = parseCSV(csvText)
  const productHash = await fetchAllProductsForRates(apiKey)
  const rates = processAiPricebookRates(csvData, productHash, defaultEffectiveAt, usageCreditTypeId)

  if (rates.length === 0) {
    throw new Error('No valid rates found in CSV')
  }

  const result = await addRatesToRateCard(apiKey, rateCardId, rates)

  return { ratesSent: result.totalSent, errors: result.errors }
}

export async function createBillableMetrics(apiKey: string): Promise<Record<string, string>> {
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

export async function createProducts(apiKey: string, metricIds: Record<string, string>): Promise<Record<string, string>> {
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

async function listActiveSubscriptionProductNameToId(
  apiKey: string,
  names: readonly string[]
): Promise<Record<string, string>> {
  const want = new Set(names)
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
      const t = p.type as string | undefined
      if (t !== 'SUBSCRIPTION' && t !== 'subscription') continue
      const name = p.current?.name as string | undefined
      if (!name || !want.has(name)) continue
      if (map[name] === undefined) {
        map[name] = p.id
      }
    }

    nextPage = json.next_page ?? null
    if (!nextPage) break
  }

  return map
}

/**
 * Ensures Good / Better / Best Subscription products exist (matched by name on active SUBSCRIPTION rows).
 */
export async function ensureHybridSeatSubscriptionProducts(apiKey: string): Promise<{
  ids: Record<string, string>
  created: string[]
}> {
  const names = HYBRID_SEAT_SUBSCRIPTION_DEFS.map((d) => d.name)
  const existing = await listActiveSubscriptionProductNameToId(apiKey, names)
  const ids: Record<string, string> = { ...existing }
  const created: string[] = []
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/products/create`

  for (const def of HYBRID_SEAT_SUBSCRIPTION_DEFS) {
    if (ids[def.name]) continue

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: def.name,
        type: 'subscription',
        tags: def.tags,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create subscription product "${def.name}": ${JSON.stringify(data)}`)
    }

    ids[def.name] = data.data.id
    created.push(def.name)
  }

  return { ids, created }
}

export function buildHybridSeatSubscriptionRates(
  productNameToId: Record<string, string>,
  startingAt: string
): Rate[] {
  const rates: Rate[] = []
  for (const row of HYBRID_SEAT_SUBSCRIPTION_LIST_RATES) {
    const productId = productNameToId[row.productName]
    if (!productId) {
      throw new Error(`Missing product id for subscription "${row.productName}"`)
    }
    rates.push({
      product_id: productId,
      effective_at: startingAt,
      starting_at: startingAt,
      entitled: true,
      rate_type: 'flat',
      price: row.price,
      billing_frequency: row.billing_frequency,
      pricing_group_values: {},
    })
  }
  return rates
}

export async function addHybridSeatSubscriptionRates(
  apiKey: string,
  rateCardId: string,
  productNameToId: Record<string, string>
): Promise<{ ratesSent: number; errors: string[] }> {
  const currentYear = new Date().getFullYear()
  const startingAt = `${currentYear}-01-01T00:00:00Z`
  const rates = buildHybridSeatSubscriptionRates(productNameToId, startingAt)
  const r = await addRatesToRateCard(apiKey, rateCardId, rates)
  return { ratesSent: r.totalSent, errors: r.errors }
}

/** UTC midnight on the first day of the current month (contract / subscription starts). */
export function metronomeFirstOfMonthUtc(): string {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1, 0, 0, 0, 0)).toISOString()
}

async function findActiveRateCardIdByName(apiKey: string, name: string): Promise<string | undefined> {
  let nextPage: string | null = null
  while (true) {
    const qp = nextPage ? `&next_page=${encodeURIComponent(nextPage)}` : ''
    const res = await fetch(
      `${METRONOME_API_URL}/contract-pricing/rate-cards/list?limit=100${qp}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Failed to list rate cards: ${res.status} ${t}`)
    }
    const json = (await res.json()) as {
      data?: Array<{
        id: string
        archived_at?: unknown
        name?: string
        current?: { name?: string }
      }>
      next_page?: string | null
    }
    for (const row of json.data || []) {
      if (row.archived_at != null) continue
      const n = (row.name ?? row.current?.name) as string | undefined
      if (n === name) return row.id as string
    }
    nextPage = json.next_page ?? null
    if (!nextPage) break
  }
  return undefined
}

async function listActiveUsageProductNameToIdByPrefix(
  apiKey: string,
  prefix: string
): Promise<Record<string, string>> {
  const map: Record<string, string> = {}
  let nextPage: string | null = null
  while (true) {
    const qp = nextPage ? `&next_page=${encodeURIComponent(nextPage)}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/contract-pricing/products/list?limit=100${qp}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    )
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Failed to list products: ${response.status} ${text}`)
    }
    const json = (await response.json()) as {
      data?: Array<{
        id: string
        archived_at?: unknown
        type?: string
        current?: { name?: string }
      }>
      next_page?: string | null
    }
    for (const p of json.data || []) {
      if (p.archived_at != null) continue
      const t = String(p.type ?? '').toUpperCase()
      if (t !== 'USAGE') continue
      const name = p.current?.name as string | undefined
      if (!name || !name.startsWith(prefix)) continue
      if (map[name] === undefined) {
        map[name] = p.id
      }
    }
    nextPage = json.next_page ?? null
    if (!nextPage) break
  }
  return map
}

/**
 * Resolves catalog ids needed for {@link createHybridSeatUsageContract} from an account
 * that already ran the hybrid generator (rate card, seat SKUs, fixed Credit, Chat usage SKUs).
 */
export async function resolveHybridExampleContractCatalog(apiKey: string): Promise<{
  rateCardId: string
  creditTypeId: string
  subscriptionProductIds: Record<string, string>
  creditFixedProductId: string
  usageProductIds: Record<string, string>
}> {
  const rateCardId = await findActiveRateCardIdByName(apiKey, HYBRID_RATE_CARD_NAME)
  if (!rateCardId) {
    throw new Error(`Rate card "${HYBRID_RATE_CARD_NAME}" not found. Run the hybrid generator first.`)
  }

  const rcRes = await fetch(`${METRONOME_API_URL}/contract-pricing/rate-cards/get`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: rateCardId }),
  })
  const rcJson = await rcRes.json()
  if (!rcRes.ok) {
    throw new Error(`Failed to get rate card: ${JSON.stringify(rcJson)}`)
  }
  const rcData = rcJson.data ?? rcJson
  const conv =
    rcData.credit_type_conversions ??
    rcData.current?.credit_type_conversions ??
    (rcData as { credit_type_conversions?: unknown }).credit_type_conversions
  const first = Array.isArray(conv) ? conv[0] : undefined
  const creditTypeId =
    (first as { custom_credit_type_id?: string; custom_credit_type?: { id?: string } } | undefined)
      ?.custom_credit_type_id ??
    (first as { custom_credit_type?: { id?: string } } | undefined)?.custom_credit_type?.id ??
    ''
  if (!creditTypeId) {
    throw new Error(
      'Could not read custom_credit_type_id from hybrid rate card (credit_type_conversions).'
    )
  }

  const fixed = await listActiveFixedProductNameToId(apiKey)
  const creditFixedProductId = fixed['Credit']
  if (!creditFixedProductId) {
    throw new Error('Fixed product "Credit" not found.')
  }

  const subNames = HYBRID_SEAT_SUBSCRIPTION_DEFS.map((d) => d.name)
  const subscriptionProductIds = await listActiveSubscriptionProductNameToId(apiKey, subNames)
  for (const n of subNames) {
    if (!subscriptionProductIds[n]) {
      throw new Error(`Subscription product "${n}" not found.`)
    }
  }

  const usageProductIds = await listActiveUsageProductNameToIdByPrefix(apiKey, 'Chat -')

  return {
    rateCardId,
    creditTypeId,
    subscriptionProductIds,
    creditFixedProductId,
    usageProductIds,
  }
}

/**
 * Creates a demo customer and hybrid contract: SEAT_BASED **Better** and **Best** subscriptions
 * only, with two monthly recurring credits (1200 / 2500 AI Credits per seat) on the fixed
 * "Credit" product and `access_amount.credit_type_id` = `creditTypeId`.
 */
/** 20% discount: list × 0.8 */
const HYBRID_CONTRACT_MULTIPLIER = 0.8

export async function createHybridSeatUsageContract(
  apiKey: string,
  options: {
    rateCardId: string
    /** Metronome custom pricing unit UUID — same as hybrid rate card AI Credits id */
    creditTypeId: string
    subscriptionProductIds: Record<string, string>
    creditFixedProductId: string
    /** Usage product name → id (e.g. from createProducts); Chat-* rows get multiplier overrides */
    usageProductIds?: Record<string, string>
    /** If set, skip creating a customer and attach the contract to this customer */
    existingCustomerId?: string
  }
): Promise<{ customerId: string; contractId: string; ingestAlias?: string }> {
  const betterId = options.subscriptionProductIds['Better Subscription']
  const bestId = options.subscriptionProductIds['Best Subscription']
  if (!betterId || !bestId) {
    throw new Error('Better Subscription and Best Subscription product ids are required (ensure seat SKUs exist).')
  }
  if (!options.creditFixedProductId) {
    throw new Error('Fixed product "Credit" id is required for recurring_credits.')
  }

  const startingAt = metronomeFirstOfMonthUtc()
  let customerId: string
  let ingestAlias: string | undefined

  if (options.existingCustomerId) {
    customerId = options.existingCustomerId
  } else {
    ingestAlias = `hybrid-seat-demo-${randomUUID().slice(0, 8)}`
    const customerRes = await fetch(`${METRONOME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'enterprise customer',
        ingest_aliases: [ingestAlias],
      }),
    })
    const customerJson = await customerRes.json()
    if (!customerRes.ok) {
      throw new Error(`Failed to create customer: ${JSON.stringify(customerJson)}`)
    }
    customerId = customerJson.data?.id as string
    if (!customerId) {
      throw new Error(`No customer id in response: ${JSON.stringify(customerJson)}`)
    }
  }

  const usageMap = options.usageProductIds ?? {}
  const overrides: Array<{
    product_id: string
    type: 'MULTIPLIER'
    multiplier: number
    starting_at: string
  }> = []

  for (const def of HYBRID_SEAT_SUBSCRIPTION_DEFS) {
    const pid = options.subscriptionProductIds[def.name]
    if (pid) {
      overrides.push({
        product_id: pid,
        type: 'MULTIPLIER',
        multiplier: HYBRID_CONTRACT_MULTIPLIER,
        starting_at: startingAt,
      })
    }
  }

  for (const [name, pid] of Object.entries(usageMap)) {
    if (!name.startsWith('Chat -')) continue
    overrides.push({
      product_id: pid,
      type: 'MULTIPLIER',
      multiplier: HYBRID_CONTRACT_MULTIPLIER,
      starting_at: startingAt,
    })
  }

  const body: Record<string, unknown> = {
    customer_id: customerId,
    starting_at: startingAt,
    name: 'Hybrid Seat+ Usage example contract',
    rate_card_id: options.rateCardId,
    subscriptions: [
      {
        collection_schedule: 'ADVANCE',
        proration: {
          is_prorated: false,
          invoice_behavior: 'BILL_IMMEDIATELY',
        },
        subscription_rate: {
          product_id: betterId,
          billing_frequency: 'MONTHLY',
        },
        quantity_management_mode: 'SEAT_BASED',
        temporary_id: HYBRID_TMP_SUBSCRIPTION_BETTER,
        seat_config: {
          seat_group_key: 'user_id',
          initial_seat_ids: [...HYBRID_BETTER_INITIAL_SEAT_USER_IDS],
        },
      },
      {
        collection_schedule: 'ADVANCE',
        proration: {
          is_prorated: false,
          invoice_behavior: 'BILL_IMMEDIATELY',
        },
        subscription_rate: {
          product_id: bestId,
          billing_frequency: 'MONTHLY',
        },
        quantity_management_mode: 'SEAT_BASED',
        temporary_id: HYBRID_TMP_SUBSCRIPTION_BEST,
        seat_config: {
          seat_group_key: 'user_id',
          initial_seat_ids: [...HYBRID_BEST_INITIAL_SEAT_USER_IDS],
        },
      },
    ],
    recurring_credits: [
      {
        name: 'include credits for better subscriptions',
        product_id: options.creditFixedProductId,
        starting_at: startingAt,
        priority: 1,
        commit_duration: { value: 1, unit: 'PERIODS' },
        recurrence_frequency: 'MONTHLY',
        access_amount: {
          credit_type_id: options.creditTypeId,
          unit_price: HYBRID_RECURRING_CREDIT_BETTER_UNIT_PRICE,
        },
        subscription_config: {
          subscription_id: HYBRID_TMP_SUBSCRIPTION_BETTER,
          allocation: 'INDIVIDUAL',
          apply_seat_increase_config: { is_prorated: false },
        },
      },
      {
        name: 'include credits for best subscriptions',
        product_id: options.creditFixedProductId,
        starting_at: startingAt,
        priority: 2,
        commit_duration: { value: 1, unit: 'PERIODS' },
        recurrence_frequency: 'MONTHLY',
        access_amount: {
          credit_type_id: options.creditTypeId,
          unit_price: HYBRID_RECURRING_CREDIT_BEST_UNIT_PRICE,
        },
        subscription_config: {
          subscription_id: HYBRID_TMP_SUBSCRIPTION_BEST,
          allocation: 'INDIVIDUAL',
          apply_seat_increase_config: { is_prorated: false },
        },
      },
    ],
    overrides,
    uniqueness_key: randomUUID(),
  }

  const contractRes = await fetch(`${METRONOME_API_URL}/contracts/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const contractJson = await contractRes.json()
  if (!contractRes.ok) {
    throw new Error(`Failed to create hybrid contract: ${JSON.stringify(contractJson)}`)
  }
  const contractId = contractJson.data?.id as string | undefined
  if (!contractId) {
    throw new Error(`No contract id in response: ${JSON.stringify(contractJson)}`)
  }

  return { customerId, contractId, ingestAlias }
}

/**
 * Creates the six hybrid package templates on the account. Recurring credits use
 * `creditFixedProductId` (the **Credit** fixed product from {@link ensureFixedProducts})
 * and `creditTypeId` (the custom AI Credits unit from the hybrid generator input).
 */
export async function createHybridPackageTemplates(
  apiKey: string,
  options: {
    rateCardId: string
    creditTypeId: string
    creditFixedProductId: string
    subscriptionProductIds: Record<string, string>
  }
): Promise<{ created: Record<string, string>; errors: string[] }> {
  const created: Record<string, string> = {}
  const errors: string[] = []

  for (const spec of HYBRID_PACKAGE_TEMPLATE_SPECS) {
    const subProductId = options.subscriptionProductIds[spec.subscriptionProductName]
    if (!subProductId) {
      errors.push(`"${spec.name}": missing product id for ${spec.subscriptionProductName}`)
      continue
    }

    const tmplSubId = `hybrid-pkg-${randomUUID()}`

    const recurringCredit: Record<string, unknown> = {
      name: spec.recurringCreditDisplayName,
      product_id: options.creditFixedProductId,
      access_amount: {
        unit_price: spec.recurringCreditUnitPrice,
        credit_type_id: options.creditTypeId,
      },
      priority: 1,
      rate_type: 'LIST_RATE',
      starting_at_offset: { value: 0, unit: 'DAYS' },
      commit_duration: { value: 1, unit: 'PERIODS' },
      proration: 'FIRST_AND_LAST',
      subscription_config: {
        subscription_id: tmplSubId,
        allocation: 'POOLED',
        apply_seat_increase_config: { is_prorated: true },
      },
    }
    if (spec.recurringCreditRecurrenceFrequency) {
      recurringCredit.recurrence_frequency = spec.recurringCreditRecurrenceFrequency
    }

    const body: Record<string, unknown> = {
      name: spec.name,
      rate_card_id: options.rateCardId,
      uniqueness_key: randomUUID(),
      usage_statement_schedule: { frequency: 'MONTHLY', day: 'FIRST_OF_MONTH' },
      multiplier_override_prioritization: 'LOWEST_MULTIPLIER',
      subscriptions: [
        {
          temporary_id: tmplSubId,
          collection_schedule: 'ADVANCE',
          proration: {
            is_prorated: true,
            invoice_behavior: 'BILL_IMMEDIATELY',
          },
          initial_quantity: 1,
          quantity_management_mode: 'QUANTITY_ONLY',
          starting_at_offset: { value: 0, unit: 'DAYS' },
          subscription_rate: {
            billing_frequency: spec.billingFrequency,
            product_id: subProductId,
          },
          fiat_credit_type_id: FIAT_USD_CENTS_CREDIT_TYPE_ID,
          custom_fields: {},
        },
      ],
      recurring_credits: [recurringCredit],
    }

    const res = await fetch(`${METRONOME_API_URL}/packages/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const json = (await res.json()) as { data?: { id?: string }; message?: string }
    if (!res.ok) {
      errors.push(`"${spec.name}": ${JSON.stringify(json)}`)
      continue
    }
    const pkgId = json.data?.id
    if (!pkgId) {
      errors.push(`"${spec.name}": no package id in response`)
      continue
    }
    created[spec.name] = pkgId
  }

  return { created, errors }
}
