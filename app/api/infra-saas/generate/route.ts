import { NextRequest, NextResponse } from 'next/server'

const METRONOME_API_URL = 'https://api.metronome.com/v1'

interface BillableMetric {
  name: string
  type: 'streaming' | 'sql'
  aggregation_type?: string
  aggregation_key?: string
  event_types?: string[]
  group_keys?: string[][]
  property_filters?: any[]
  sql?: string
}

interface Product {
  name: string
  type: 'usage' | 'fixed' | 'composite'
  pricing_group_key?: string[]
  tags?: string[]
  quantity_conversion?: any
  quantity_rounding?: any
  composite_tags?: string[]
  billable_metric_id?: string
}

interface RateCard {
  name: string
  aliases?: { name: string }[]
}

const billableMetrics: BillableMetric[] = [
  {
    name: 'Read',
    type: 'streaming',
    aggregation_type: 'sum',
    aggregation_key: 'value',
    event_types: ['iops_read'],
    group_keys: [['db_type', 'cloud_provider', 'region', 'cluster_id']],
    property_filters: [
      { name: 'cloud_provider', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'value', exists: true },
      { name: 'db_type', exists: true, in_values: ['vector', 'non-vector'] }
    ]
  },
  {
    name: 'Write',
    type: 'streaming',
    aggregation_type: 'sum',
    aggregation_key: 'value',
    event_types: ['iops_write'],
    group_keys: [['db_type', 'cloud_provider', 'region', 'cluster_id']],
    property_filters: [
      { name: 'cloud_provider', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'value', exists: true },
      { name: 'db_type', exists: true, in_values: ['vector', 'non-vector'] }
    ]
  },
  {
    name: 'Compute',
    type: 'streaming',
    aggregation_type: 'sum',
    aggregation_key: 'value',
    event_types: ['compute'],
    group_keys: [['db_type', 'cloud_provider', 'region', 'cluster_id']],
    property_filters: [
      { name: 'cloud_provider', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'value', exists: true },
      { name: 'db_type', exists: true, in_values: ['vector', 'non-vector'] }
    ]
  },
  {
    name: 'Data Transfer',
    type: 'streaming',
    aggregation_type: 'sum',
    aggregation_key: 'value',
    event_types: ['data_transfer'],
    group_keys: [['db_type', 'cloud_provider', 'region', 'cluster_id']],
    property_filters: [
      { name: 'cloud_provider', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'value', exists: true },
      { name: 'db_type', exists: true, in_values: ['vector', 'non-vector'] }
    ]
  },
  {
    name: 'Storage',
    type: 'sql',
    sql: `select db_type, cloud_provider, region, sum(volume) as value 
      from (
          select 
              properties.db_type as db_type,
              properties.cloud_provider as cloud_provider,
              properties.region as region,
              max(properties.value) as volume
          from events where event_type='storage'
          group by properties.cluster_id, properties.db_type,
              properties.cloud_provider,
              properties.region 
      )
      group by db_type, region, cloud_provider`
  }
]

const products: Product[] = [
  {
    name: 'Read',
    type: 'usage',
    pricing_group_key: ['db_type', 'cloud_provider', 'region'],
    tags: ['all'],
    quantity_conversion: { conversion_factor: 1000, operation: 'divide' },
    quantity_rounding: { decimal_places: 0, rounding_method: 'round_up' }
  },
  {
    name: 'Write',
    type: 'usage',
    pricing_group_key: ['db_type', 'cloud_provider', 'region'],
    tags: ['all'],
    quantity_conversion: { conversion_factor: 1000, operation: 'divide' },
    quantity_rounding: { decimal_places: 0, rounding_method: 'round_up' }
  },
  {
    name: 'Compute',
    type: 'usage',
    pricing_group_key: ['db_type', 'cloud_provider', 'region'],
    tags: ['all']
  },
  {
    name: 'Data Transfer',
    type: 'usage',
    pricing_group_key: ['db_type', 'cloud_provider', 'region'],
    tags: ['all']
  },
  {
    name: 'Storage',
    type: 'usage',
    pricing_group_key: ['db_type', 'cloud_provider', 'region'],
    tags: ['all'],
    quantity_conversion: { conversion_factor: 1073741824, operation: 'divide', name: 'Bytes to gigabytes' }
  },
  {
    name: 'Free Trial Credits',
    type: 'fixed'
  },
  {
    name: 'Prepaid Commit',
    type: 'fixed'
  },
  {
    name: 'Support',
    type: 'composite',
    composite_tags: ['all']
  }
]

const rateCards: RateCard[] = [
  { name: 'Growth', aliases: [{ name: 'growth' }] },
  { name: 'Enterprise', aliases: [{ name: 'enterprise' }] }
]

async function createBillableMetrics(apiKey: string) {
  const metricIds: Record<string, string> = {}
  const apiUrl = `${METRONOME_API_URL}/billable-metrics/create`

  for (const metric of billableMetrics) {
    let payload: any

    if (metric.type === 'streaming') {
      payload = {
        name: metric.name,
        aggregation_type: metric.aggregation_type,
        aggregation_key: metric.aggregation_key,
        event_type_filter: {
          in_values: metric.event_types
        },
        property_filters: metric.property_filters,
        group_keys: metric.group_keys
      }
    } else {
      payload = {
        name: metric.name,
        sql: metric.sql
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create billable metric ${metric.name}: ${JSON.stringify(data)}`)
    }

    metricIds[metric.name] = data.data.id
  }

  return metricIds
}

async function createProducts(apiKey: string, metricIds: Record<string, string>) {
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/products/create`
  const productIds: Record<string, string> = {}

  for (const product of products) {
    const productJson: any = { ...product }

    if (product.type === 'usage') {
      productJson.billable_metric_id = metricIds[product.name]
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productJson)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create product ${product.name}: ${JSON.stringify(data)}`)
    }

    productIds[product.name] = data.data.id
  }

  return productIds
}

async function createRateCards(apiKey: string) {
  const apiUrl = `${METRONOME_API_URL}/contract-pricing/rate-cards/create`
  const rateCardIds: Record<string, string> = {}

  for (const rateCard of rateCards) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rateCard)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create rate card ${rateCard.name}: ${JSON.stringify(data)}`)
    }

    rateCardIds[rateCard.name] = data.data.id
  }

  return rateCardIds
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const results: any = {
      billableMetrics: {},
      products: {},
      rateCards: {},
      errors: []
    }

    try {
      // Step 1: Create billable metrics
      results.billableMetrics = await createBillableMetrics(apiKey)
    } catch (error) {
      results.errors.push(`Billable metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Step 2: Create products (depends on billable metrics)
      if (Object.keys(results.billableMetrics).length > 0) {
        results.products = await createProducts(apiKey, results.billableMetrics)
      }
    } catch (error) {
      results.errors.push(`Products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Step 3: Create rate cards
      results.rateCards = await createRateCards(apiKey)
    } catch (error) {
      results.errors.push(`Rate cards: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      message: results.errors.length === 0
        ? 'Infra SaaS demo objects created successfully'
        : 'Some objects were created, but errors occurred'
    })
  } catch (error) {
    console.error('Error generating Infra SaaS demo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate demo' },
      { status: 500 }
    )
  }
}
