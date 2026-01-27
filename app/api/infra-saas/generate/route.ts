import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const METRONOME_API_URL = 'https://api.metronome.com/v1'
const METRONOME_API_V2_URL = 'https://api.metronome.com/v2'
const CSV_FILE_PATH = join(process.cwd(), 'data', 'pricebook.csv')

interface BillableMetric {
  name: string
  event_type_filter: { in_values: string[] }
  property_filters: any[]
  aggregation_type: string
  aggregation_key: string
  group_keys: string[][]
}

interface Product {
  name: string
  type: 'usage' | 'fixed' | 'composite'
  pricing_group_key?: string[]
  presentation_group_key?: string[]
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

interface Package {
  name: string
  tags?: string[]
  product_tags?: string[]
  rate_card_id?: string
}

// Billable metric definitions for infrastructure SaaS demo
const billableMetrics: BillableMetric[] = [
  {
    name: 'Storage (GiB-minutes)',
    event_type_filter: { in_values: ['cluster_heartbeat'] },
    property_filters: [
      { name: 'storage_gib_minutes', exists: true },
      { name: 'cluster_type', exists: true },
      { name: 'team_id', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'cloud_provider', exists: true }
    ],
    aggregation_type: 'sum',
    aggregation_key: 'storage_gib_minutes',
    group_keys: [['cluster_type', 'cloud_provider', 'region', 'team_id', 'cluster_id']]
  },
  {
    name: 'Compute (CPU-minutes)',
    event_type_filter: { in_values: ['cluster_heartbeat'] },
    property_filters: [
      { name: 'cpu_minutes', exists: true },
      { name: 'cluster_type', exists: true },
      { name: 'team_id', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'cloud_provider', exists: true }
    ],
    aggregation_type: 'sum',
    aggregation_key: 'cpu_minutes',
    group_keys: [['cluster_type', 'cloud_provider', 'region', 'team_id', 'cluster_id']]
  },
  {
    name: 'Network Ingress (GB)',
    event_type_filter: { in_values: ['cluster_heartbeat'] },
    property_filters: [
      { name: 'ingress_gb', exists: true },
      { name: 'cluster_type', exists: true },
      { name: 'team_id', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'cloud_provider', exists: true }
    ],
    aggregation_type: 'sum',
    aggregation_key: 'ingress_gb',
    group_keys: [['cluster_type', 'cloud_provider', 'region', 'team_id', 'cluster_id']]
  },
  {
    name: 'Network Egress (GB)',
    event_type_filter: { in_values: ['cluster_heartbeat'] },
    property_filters: [
      { name: 'egress_gb', exists: true },
      { name: 'cluster_type', exists: true },
      { name: 'team_id', exists: true },
      { name: 'cluster_id', exists: true },
      { name: 'region', exists: true },
      { name: 'cloud_provider', exists: true }
    ],
    aggregation_type: 'sum',
    aggregation_key: 'egress_gb',
    group_keys: [['cluster_type', 'cloud_provider', 'region', 'team_id', 'cluster_id']]
  }
]

const products: Product[] = [
  {
    name: 'Storage (GiB-minutes)',
    type: 'usage',
    pricing_group_key: ['cluster_type', 'cloud_provider', 'region'],
    presentation_group_key: ['cluster_id', 'team_id'],
    tags: ['all']
  },
  {
    name: 'Compute (CPU-minutes)',
    type: 'usage',
    pricing_group_key: ['cluster_type', 'cloud_provider', 'region'],
    presentation_group_key: ['cluster_id', 'team_id'],
    tags: ['all']
  },
  {
    name: 'Network Ingress (GB)',
    type: 'usage',
    pricing_group_key: ['cluster_type', 'cloud_provider', 'region'],
    presentation_group_key: ['cluster_id', 'team_id'],
    tags: ['all']
  },
  {
    name: 'Network Egress (GB)',
    type: 'usage',
    pricing_group_key: ['cluster_type', 'cloud_provider', 'region'],
    presentation_group_key: ['cluster_id', 'team_id'],
    tags: ['all']
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
  { name: 'Standard Rate Card' }
]

// Only one package: Free Trial for free trial customers
const packages: Package[] = [
  {
    name: 'Free Trial',
    tags: ['free-trial'],
    product_tags: ['all']
  }
]

async function createBillableMetrics(apiKey: string) {
  const metricIds: Record<string, string> = {}
  const apiUrl = `${METRONOME_API_URL}/billable-metrics/create`

  // Creating billable metrics

  for (const metric of billableMetrics) {
    const payload = {
      name: metric.name,
      event_type_filter: metric.event_type_filter,
      property_filters: metric.property_filters,
      aggregation_type: metric.aggregation_type,
      aggregation_key: metric.aggregation_key,
      group_keys: metric.group_keys
    }

    // Creating billable metric

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
      console.error(`Failed to create ${metric.name}:`, data)
      throw new Error(`Failed to create billable metric ${metric.name}: ${JSON.stringify(data)}`)
    }

    // Billable metric created successfully
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
      // Map product name to billable metric ID
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

    // Store product ID using exact product name as key
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

async function findExistingPackage(apiKey: string, packageName: string): Promise<string | null> {
  try {
    let nextPage: string | null = null
    
    while (true) {
      const nextPageParam = nextPage ? `&next_page=${nextPage}` : ''
      const response = await fetch(
        `${METRONOME_API_URL}/packages/list?limit=100${nextPageParam}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      )

      if (!response.ok) {
        return null
      }

      const responseJson = await response.json()
      const responseData = responseJson.data || []

      for (const pkg of responseData) {
        // Check both name and trimmed name (in case of trailing spaces)
        const pkgName = pkg.name?.trim() || pkg.current?.name?.trim()
        if (pkgName === packageName.trim()) {
          return pkg.id
        }
      }

      nextPage = responseJson.next_page || null
      if (!nextPage) break
    }
  } catch (error) {
    console.error('Error checking for existing package:', error)
    return null
  }
  
  return null
}

async function createPackages(apiKey: string, rateCardIds: Record<string, string>) {
  const apiUrl = `${METRONOME_API_URL}/packages/create`
  const packageIds: Record<string, string> = {}

  // Only create one package: Free Trial
  for (const pkg of packages) {
    // Check if package already exists to avoid duplicates
    const existingId = await findExistingPackage(apiKey, pkg.name)
    if (existingId) {
      // Package already exists, reusing it
      packageIds[pkg.name] = existingId
      continue
    }

    const packageJson: any = {
      name: pkg.name,
      ...(pkg.tags && { tags: pkg.tags }),
      ...(pkg.product_tags && { product_tags: pkg.product_tags }),
      ...(pkg.rate_card_id && { rate_card_id: pkg.rate_card_id })
    }

    // If rate_card_id is not specified, use Standard Rate Card
    if (!pkg.rate_card_id && rateCardIds['Standard Rate Card']) {
      packageJson.rate_card_id = rateCardIds['Standard Rate Card']
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packageJson)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Failed to create package ${pkg.name}: ${JSON.stringify(data)}`)
    }

    packageIds[pkg.name] = data.data.id
  }

  return packageIds
}

function getFirstDayOfCurrentMonth(): string {
  const now = new Date()
  // Get UTC date to ensure we're always using UTC midnight
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1 // getUTCMonth() returns 0-11
  return `${year}-${String(month).padStart(2, '0')}-01T00:00:00Z`
}

function getThreeMonthsLater(startDate: string): string {
  const date = new Date(startDate)
  // Add 3 months to get to the 4th month (e.g., Jan 1 -> April 1)
  const currentYear = date.getUTCFullYear()
  const currentMonth = date.getUTCMonth() // 0-11
  const targetMonth = currentMonth + 3 // Add 3 months
  const targetYear = currentYear + Math.floor(targetMonth / 12)
  const finalMonth = (targetMonth % 12) + 1 // Convert to 1-12
  return `${targetYear}-${String(finalMonth).padStart(2, '0')}-01T00:00:00Z`
}

function getOneYearLater(startDate: string): string {
  const date = new Date(startDate)
  // Add exactly 12 months (1 year) at UTC midnight
  const currentYear = date.getUTCFullYear()
  const currentMonth = date.getUTCMonth() // 0-11
  const targetYear = currentYear + 1
  const finalMonth = currentMonth + 1 // Convert to 1-12
  return `${targetYear}-${String(finalMonth).padStart(2, '0')}-01T00:00:00Z`
}

function getThreeYearsLater(startDate: string): string {
  const date = new Date(startDate)
  // Add exactly 36 months (3 years) at UTC midnight
  const currentYear = date.getUTCFullYear()
  const currentMonth = date.getUTCMonth() // 0-11
  const targetYear = currentYear + 3
  const finalMonth = currentMonth + 1 // Convert to 1-12
  return `${targetYear}-${String(finalMonth).padStart(2, '0')}-01T00:00:00Z`
}

function generateRandomSixDigits(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
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

async function fetchAllProductsForRates(apiKey: string) {
  const productHash: Record<string, { id: string }> = {}
  let nextPage: string | null = null

  while (true) {
    const nextPageParam = nextPage ? `&next_page=${nextPage}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/contract-pricing/products/list?limit=100${nextPageParam}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
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
        id: product.id
      }
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return productHash
}

function parseCSV(csvText: string): { headers: string[], rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headers = lines[0].split(',').map(h => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    rows.push(row)
  }

  return { headers, rows }
}

function processCSVRates(
  csvData: { headers: string[], rows: Record<string, string>[] },
  productHash: Record<string, { id: string }>,
  defaultEffectiveAt: string
): Rate[] {
  const requiredFields = ['product_name', 'price']
  const knownFields = ['product_name', 'price', 'effective_at', 'entitled', 'rate_type']
  
  // Validate required fields
  for (const field of requiredFields) {
    if (!csvData.headers.includes(field)) {
      throw new Error(`${field} field required in CSV`)
    }
  }

  // Find pricing group key fields (any field not in known fields)
  const pricingGroupKeyFields = csvData.headers.filter(
    field => !knownFields.includes(field)
  )

  const rates: Rate[] = []

  for (const row of csvData.rows) {
    const productName = row['product_name']
    const priceStr = row['price']
    
    if (!productName || !priceStr) {
      continue // Skip empty rows
    }

    if (!productHash[productName]) {
      // Product not found, skipping
      continue
    }

    const productId = productHash[productName].id
    const price = Math.round(parseFloat(priceStr) * 100) // Convert to cents

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
      price
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
    
    const response = await fetch(
      `${METRONOME_API_URL}/contract-pricing/rate-cards/addRates`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rate_card_id: rateCardId,
          rates: batch
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${response.status} - ${errorText}`)
    } else {
      totalSent += batch.length
    }
  }

  return { totalSent, errors }
}

async function addRatesFromCSV(apiKey: string, rateCardId: string): Promise<{ ratesSent: number; errors: string[] }> {
  // Default to January 1st of current year at midnight UTC
  const currentYear = new Date().getFullYear()
  const defaultEffectiveAt = `${currentYear}-01-01T00:00:00Z`

  // Read CSV file from project data folder
  const csvText = readFileSync(CSV_FILE_PATH, 'utf-8')

  // Parse CSV
  const csvData = parseCSV(csvText)

  // Fetch products
  const productHash = await fetchAllProductsForRates(apiKey)

  // Process CSV rates
  const rates = processCSVRates(csvData, productHash, defaultEffectiveAt)

  if (rates.length === 0) {
    throw new Error('No valid rates found in CSV')
  }

  // Add rates to rate card
  const result = await addRatesToRateCard(apiKey, rateCardId, rates)

  return { ratesSent: result.totalSent, errors: result.errors }
}

function generateAnimalClusterId(): string {
  const animals = [
    'lion', 'tiger', 'bear', 'wolf', 'fox', 'eagle', 'hawk', 'owl', 'shark', 'whale',
    'dolphin', 'elephant', 'giraffe', 'zebra', 'panda', 'koala', 'kangaroo', 'penguin', 'seal', 'otter',
    'rabbit', 'deer', 'moose', 'elk', 'bison', 'buffalo', 'coyote', 'lynx', 'bobcat', 'cougar',
    'jaguar', 'leopard', 'cheetah', 'hyena', 'rhino', 'hippo', 'crocodile', 'alligator', 'snake', 'python',
    'cobra', 'viper', 'lizard', 'gecko', 'iguana', 'turtle', 'tortoise', 'frog', 'toad', 'salamander',
    'octopus', 'squid', 'crab', 'lobster', 'shrimp', 'starfish', 'jellyfish', 'coral', 'anemone', 'urchin',
    'sparrow', 'robin', 'cardinal', 'bluejay', 'crow', 'raven', 'magpie', 'finch', 'wren', 'thrush',
    'swan', 'goose', 'duck', 'heron', 'crane', 'stork', 'flamingo', 'pelican', 'albatross', 'gull',
    'horse', 'cow', 'pig', 'sheep', 'goat', 'chicken', 'turkey', 'duck', 'goose', 'rooster'
  ]
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)]
  const sixDigits = generateRandomSixDigits()
  return `${randomAnimal}-${sixDigits}`
}

async function createCustomers(apiKey: string, packageIds: Record<string, string>, rateCardIds: Record<string, string>, productIds: Record<string, string>) {
  const customerIds: Record<string, string> = {}
  const contractIds: Record<string, string> = {}
  const ingestAliases: Record<string, string> = {}
  const startDate = getFirstDayOfCurrentMonth()
  const freeTrialEndDate = getThreeMonthsLater(startDate)
  const oneYearEndDate = getOneYearLater(startDate)
  
  // Get product IDs we need - ensure exact name match
  const freeTrialCreditsProductId = productIds['Free Trial Credits']
  const prepaidCommitProductId = productIds['Prepaid Commit']
  const standardRateCardId = rateCardIds['Standard Rate Card']
  const freeTrialPackageId = packageIds['Free Trial']

  // Validate required IDs

  // Validate required IDs
  if (!standardRateCardId) {
    throw new Error('Standard Rate Card ID is required but not found. Available rate cards: ' + JSON.stringify(Object.keys(rateCardIds)))
  }
  
  if (!freeTrialCreditsProductId) {
    throw new Error('Free Trial Credits product ID is required but not found. Available products: ' + JSON.stringify(Object.keys(productIds)) + '. Looking for exact match: "Free Trial Credits"')
  }
  
  if (!prepaidCommitProductId) {
    // Prepaid Commit product ID not found
  }

  // 1. Paygo customer
  try {
    const randomCode1 = generateRandomSixDigits()
    const paygoIngestAlias = `paygo-customer-${randomCode1}`
    
    // Create customer
    const customerResponse = await fetch(`${METRONOME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Paygo customer',
        ingest_aliases: [paygoIngestAlias]
      })
    })

    const customerData = await customerResponse.json()
    if (!customerResponse.ok) {
      throw new Error(`Failed to create paygo customer: ${JSON.stringify(customerData)}`)
    }
    const paygoCustomerId = customerData.data.id
    customerIds['Paygo customer'] = paygoCustomerId
    ingestAliases['Paygo customer'] = paygoIngestAlias

    // Verify customer was created successfully
    if (!paygoCustomerId) {
      throw new Error('Failed to get customer ID from customer creation response')
    }

    // Create contract for paygo customer
    if (!standardRateCardId) {
      throw new Error('Standard Rate Card ID is missing for paygo contract')
    }
    
    if (!freeTrialCreditsProductId) {
      throw new Error(`Free Trial Credits product ID not found. Available products: ${JSON.stringify(Object.keys(productIds))}`)
    }
    
    const contractPayload: any = {
      customer_id: paygoCustomerId,
      starting_at: startDate,
      name: 'paygo contract',
      rate_card_id: standardRateCardId,
      credits: [
        {
          product_id: freeTrialCreditsProductId,
          access_schedule: {
            schedule_items: [{
              amount: 500000, // $5000 in cents
              starting_at: startDate,
              ending_before: freeTrialEndDate
            }]
          },
          priority: 1
        }
      ]
    }

    // Verify resources exist before creating contract
    const verifyCustomerResponse = await fetch(`${METRONOME_API_URL}/customers/${paygoCustomerId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!verifyCustomerResponse.ok) {
      const verifyError = await verifyCustomerResponse.json()
      throw new Error(`Customer ${paygoCustomerId} does not exist or cannot be accessed: ${JSON.stringify(verifyError)}`)
    }
    
    // Verify rate card exists
    const verifyRateCardResponse = await fetch(`${METRONOME_API_URL}/contract-pricing/rate-cards/get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: standardRateCardId })
    })
    
    if (!verifyRateCardResponse.ok) {
      const verifyError = await verifyRateCardResponse.json()
      throw new Error(`Rate card ${standardRateCardId} does not exist: ${JSON.stringify(verifyError)}`)
    }
    
    // Verify product exists
    const verifyProductResponse = await fetch(`${METRONOME_API_URL}/contract-pricing/products/get`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: freeTrialCreditsProductId })
    })
    
    if (!verifyProductResponse.ok) {
      const verifyError = await verifyProductResponse.json()
      throw new Error(`Product ${freeTrialCreditsProductId} does not exist: ${JSON.stringify(verifyError)}`)
    }
    
    // Creating paygo contract
    
    // Use /v1/contracts/create endpoint
    const contractResponse = await fetch(`${METRONOME_API_URL}/contracts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contractPayload)
    })

    const contractData = await contractResponse.json()
    if (!contractResponse.ok) {
      // Contract creation failed
      throw new Error(`Failed to create paygo contract: ${JSON.stringify(contractData)}`)
    }
    contractIds['Paygo customer'] = contractData.data.id
  } catch (error) {
    throw new Error(`Paygo customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // 2. Commit customer (advanced cluster)
  try {
    const randomCode2 = generateRandomSixDigits()
    const advancedIngestAlias = `commit-customer-advanced-${randomCode2}`
    
    // Create customer
    const customerResponse = await fetch(`${METRONOME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Commit customer (advanced cluster)',
        ingest_aliases: [advancedIngestAlias]
      })
    })

    const customerData = await customerResponse.json()
    if (!customerResponse.ok) {
      throw new Error(`Failed to create advanced commit customer: ${JSON.stringify(customerData)}`)
    }
    const advancedCustomerId = customerData.data.id
    customerIds['Commit customer (advanced cluster)'] = advancedCustomerId
    ingestAliases['Commit customer (advanced cluster)'] = advancedIngestAlias

    // Create contract for advanced commit customer (3-year contract)
    const contractEndDate = getThreeYearsLater(startDate)
    const contractPayload: any = {
      customer_id: advancedCustomerId,
      starting_at: startDate,
      name: 'enterprise customer (3-year)',
      rate_card_id: standardRateCardId,
      ending_before: contractEndDate,
      commits: [],
      overrides: []
    }

    if (prepaidCommitProductId) {
      // Access schedule items:
      // First: starts on contract start date, ends on contract end date
      // Second: starts 1 year from contract start date, ends on contract end date
      // Third: starts 2 years from contract start date, ends on contract end date
      const year1Start = startDate
      const year2Start = getOneYearLater(startDate)
      const year3Start = getOneYearLater(year2Start)
      
      // Invoice schedule timestamps: contract start date, 1 year from start, 2 years from start
      const invoiceYear1 = startDate
      const invoiceYear2 = getOneYearLater(startDate)
      const invoiceYear3 = getOneYearLater(year2Start) // 2 years from contract start date
      
      contractPayload.commits.push({
        product_id: prepaidCommitProductId,
        access_schedule: {
          schedule_items: [
            { amount: 7500000, starting_at: year1Start, ending_before: contractEndDate },
            { amount: 10000000, starting_at: year2Start, ending_before: contractEndDate },
            { amount: 12500000, starting_at: year3Start, ending_before: contractEndDate }
          ]
        },
        invoice_schedule: {
          schedule_items: [
            {
              timestamp: invoiceYear1,
              amount: 7500000
            },
            {
              timestamp: invoiceYear2,
              amount: 10000000
            },
            {
              timestamp: invoiceYear3,
              amount: 12500000
            }
          ]
        },
        priority: 1,
        type: 'PREPAID'
      })
    }

    // Add overrides for usage products
    const usageProductNames = ['Storage (GiB-minutes)', 'Compute (CPU-minutes)', 'Network Ingress (GB)', 'Network Egress (GB)']
    for (const productName of usageProductNames) {
      const productId = productIds[productName]
      if (!productId) {
        // Product ID not found, skipping
        continue
      }
      contractPayload.overrides.push({
        product_id: productId,
        type: 'MULTIPLIER',
        multiplier: 0.8,
        starting_at: startDate
      })
    }
    
    const contractResponse = await fetch(`${METRONOME_API_URL}/contracts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contractPayload)
    })

    const contractData = await contractResponse.json()
    if (!contractResponse.ok) {
      // Advanced commit contract creation failed
      throw new Error(`Failed to create advanced commit contract: ${JSON.stringify(contractData)}`)
    }
    contractIds['Commit customer (advanced cluster)'] = contractData.data.id
  } catch (error) {
    throw new Error(`Advanced commit customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // 3. Commit customer (standard cluster) - one year contract
  try {
    const randomCode3 = generateRandomSixDigits()
    const standardIngestAlias = `commit-customer-standard-${randomCode3}`
    
    // Create customer
    const customerResponse = await fetch(`${METRONOME_API_URL}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Commit customer (standard cluster)',
        ingest_aliases: [standardIngestAlias]
      })
    })

    const customerData = await customerResponse.json()
    if (!customerResponse.ok) {
      throw new Error(`Failed to create standard commit customer: ${JSON.stringify(customerData)}`)
    }
    const standardCustomerId = customerData.data.id
    customerIds['Commit customer (standard cluster)'] = standardCustomerId
    ingestAliases['Commit customer (standard cluster)'] = standardIngestAlias

    // Create contract for standard commit customer (1-year contract)
    const contractPayload: any = {
      customer_id: standardCustomerId,
      starting_at: startDate,
      name: 'standard cluster customer (one-year)',
      rate_card_id: standardRateCardId,
      ending_before: oneYearEndDate,
      commits: [],
      overrides: []
    }

    if (prepaidCommitProductId) {
      contractPayload.commits.push({
        product_id: prepaidCommitProductId,
        access_schedule: {
          schedule_items: [{
            amount: 5000000, // $50,000 in cents
            starting_at: startDate,
            ending_before: oneYearEndDate
          }]
        },
        invoice_schedule: {
          schedule_items: [
            {
              timestamp: startDate,
              amount: 5000000
            }
          ]
        },
        priority: 1,
        type: 'PREPAID'
      })
    }

    // Add overrides for usage products
    const standardProductNames = ['Storage (GiB-minutes)', 'Compute (CPU-minutes)']
    for (const productName of standardProductNames) {
      const productId = productIds[productName]
      if (!productId) {
        // Product ID not found, skipping
        continue
      }
      contractPayload.overrides.push({
        product_id: productId,
        type: 'MULTIPLIER',
        multiplier: 0.9,
        starting_at: startDate
      })
    }

    const contractResponse = await fetch(`${METRONOME_API_URL}/contracts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contractPayload)
    })

    const contractData = await contractResponse.json()
    if (!contractResponse.ok) {
      // Standard commit contract creation failed
      throw new Error(`Failed to create standard commit contract: ${JSON.stringify(contractData)}`)
    }
    contractIds['Commit customer (standard cluster)'] = contractData.data.id
  } catch (error) {
    throw new Error(`Standard commit customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return { customerIds, contractIds, ingestAliases }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function generateUsageEvents(apiKey: string, ingestAliases: Record<string, string>) {
  const INGEST_URL = 'https://api.metronome.com/v1/ingest'
  const startDateStr = getFirstDayOfCurrentMonth()
  const startDate = new Date(startDateStr)
  const now = new Date()
  const BATCH_SIZE = 100
  
  // Generate cluster IDs (animal names with 6 digits)
  const paygoCluster1 = generateAnimalClusterId()
  const paygoCluster2 = generateAnimalClusterId()
  const standardBasicCluster = generateAnimalClusterId()
  const standardStandardCluster = generateAnimalClusterId()
  const advancedAwsSmallCluster = generateAnimalClusterId()
  const advancedAwsNormalCluster = generateAnimalClusterId()
  const advancedAzureNormalCluster = generateAnimalClusterId()
  
  // Generate team IDs
  const paygoTeamId = 'team-paygo-001'
  const standardTeamId = 'team-standard-001'
  const advancedTeam1 = 'team-advanced-001'
  const advancedTeam2 = 'team-advanced-002'
  
  const allEvents: any[] = []
  
  // Generate events for Paygo customer
  const paygoAlias = ingestAliases['Paygo customer']
  if (paygoAlias) {
    const currentDate = new Date(startDate)
    while (currentDate < now) {
      // Generate events for both clusters
      for (const clusterId of [paygoCluster1, paygoCluster2]) {
        const event = {
          transaction_id: generateUUID(),
          customer_id: paygoAlias,
          event_type: 'cluster_heartbeat',
          timestamp: currentDate.toISOString(),
          properties: {
            cluster_id: clusterId,
            team_id: paygoTeamId,
            cluster_type: 'basic',
            region: 'us-east-1',
            cloud_provider: 'aws',
            storage_gib_minutes: parseFloat((Math.random() * 1 + 0.5).toFixed(3)), // 0.5-1.5
            cpu_minutes: parseFloat((Math.random() * 2 + 1).toFixed(3)), // 1-3
            ingress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)), // 0.05-0.15
            egress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)) // 0.05-0.15
          }
        }
        allEvents.push(event)
      }
      // Move to next hour
      currentDate.setHours(currentDate.getHours() + 1)
    }
  }
  
  // Generate events for Standard commit customer
  const standardAlias = ingestAliases['Commit customer (standard cluster)']
  if (standardAlias) {
    const currentDate = new Date(startDate)
    while (currentDate < now) {
      // Basic cluster (low usage)
      const basicEvent = {
        transaction_id: generateUUID(),
        customer_id: standardAlias,
        event_type: 'cluster_heartbeat',
        timestamp: currentDate.toISOString(),
        properties: {
          cluster_id: standardBasicCluster,
          team_id: standardTeamId,
          cluster_type: 'basic',
          region: 'us-east-1',
          cloud_provider: 'aws',
          storage_gib_minutes: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)), // 0.05-0.15
          cpu_minutes: parseFloat((Math.random() * 0.2 + 0.1).toFixed(3)), // 0.1-0.3
          ingress_gb: parseFloat((Math.random() * 0.01 + 0.005).toFixed(3)), // 0.005-0.015
          egress_gb: parseFloat((Math.random() * 0.01 + 0.005).toFixed(3)) // 0.005-0.015
        }
      }
      allEvents.push(basicEvent)
      
      // Standard cluster (10x usage)
      const standardEvent = {
        transaction_id: generateUUID(),
        customer_id: standardAlias,
        event_type: 'cluster_heartbeat',
        timestamp: currentDate.toISOString(),
        properties: {
          cluster_id: standardStandardCluster,
          team_id: standardTeamId,
          cluster_type: 'standard',
          region: 'us-west-2',
          cloud_provider: 'aws',
          storage_gib_minutes: parseFloat((Math.random() * 1 + 0.5).toFixed(3)), // 0.5-1.5 (10x basic)
          cpu_minutes: parseFloat((Math.random() * 2 + 1).toFixed(3)), // 1-3 (10x basic)
          ingress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)), // 0.05-0.15 (10x basic)
          egress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)) // 0.05-0.15 (10x basic)
        }
      }
      allEvents.push(standardEvent)
      
      // Move to next hour
      currentDate.setHours(currentDate.getHours() + 1)
    }
  }
  
  // Generate events for Advanced commit customer
  const advancedAlias = ingestAliases['Commit customer (advanced cluster)']
  if (advancedAlias) {
    const currentDate = new Date(startDate)
    while (currentDate < now) {
      // AWS cluster 1 (very small usage) - Team 1
      const awsSmallEvent = {
        transaction_id: generateUUID(),
        customer_id: advancedAlias,
        event_type: 'cluster_heartbeat',
        timestamp: currentDate.toISOString(),
        properties: {
          cluster_id: advancedAwsSmallCluster,
          team_id: advancedTeam1,
          cluster_type: 'standard',
          region: 'us-east-1',
          cloud_provider: 'aws',
          storage_gib_minutes: parseFloat((Math.random() * 0.01 + 0.005).toFixed(3)), // 0.005-0.015 (very small)
          cpu_minutes: parseFloat((Math.random() * 0.02 + 0.01).toFixed(3)), // 0.01-0.03 (very small)
          ingress_gb: parseFloat((Math.random() * 0.001 + 0.0005).toFixed(3)), // 0.0005-0.0015 (very small)
          egress_gb: parseFloat((Math.random() * 0.001 + 0.0005).toFixed(3)) // 0.0005-0.0015 (very small)
        }
      }
      allEvents.push(awsSmallEvent)
      
      // AWS cluster 2 (normal usage) - Team 1, same region as AWS cluster 1
      const awsNormalEvent = {
        transaction_id: generateUUID(),
        customer_id: advancedAlias,
        event_type: 'cluster_heartbeat',
        timestamp: currentDate.toISOString(),
        properties: {
          cluster_id: advancedAwsNormalCluster,
          team_id: advancedTeam1,
          cluster_type: 'advanced',
          region: 'us-east-1',
          cloud_provider: 'aws',
          storage_gib_minutes: parseFloat((Math.random() * 1 + 0.5).toFixed(3)), // 0.5-1.5 (normal)
          cpu_minutes: parseFloat((Math.random() * 2 + 1).toFixed(3)), // 1-3 (normal)
          ingress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)), // 0.05-0.15 (normal)
          egress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)) // 0.05-0.15 (normal)
        }
      }
      allEvents.push(awsNormalEvent)
      
      // Azure cluster (normal usage) - Team 2
      const azureNormalEvent = {
        transaction_id: generateUUID(),
        customer_id: advancedAlias,
        event_type: 'cluster_heartbeat',
        timestamp: currentDate.toISOString(),
        properties: {
          cluster_id: advancedAzureNormalCluster,
          team_id: advancedTeam2,
          cluster_type: 'advanced',
          region: 'eastus',
          cloud_provider: 'azure',
          storage_gib_minutes: parseFloat((Math.random() * 1 + 0.5).toFixed(3)), // 0.5-1.5 (normal)
          cpu_minutes: parseFloat((Math.random() * 2 + 1).toFixed(3)), // 1-3 (normal)
          ingress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)), // 0.05-0.15 (normal)
          egress_gb: parseFloat((Math.random() * 0.1 + 0.05).toFixed(3)) // 0.05-0.15 (normal)
        }
      }
      allEvents.push(azureNormalEvent)
      
      // Move to next hour
      currentDate.setHours(currentDate.getHours() + 1)
    }
  }
  
  // Send events in batches
  let sentCount = 0
  for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
    const batch = allEvents.slice(i, i + BATCH_SIZE)
    try {
      const response = await fetch(INGEST_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send usage events batch: ${response.status} - ${errorText}`)
      }
      
      sentCount += batch.length
      // Sent batch of usage events
    } catch (error) {
      throw new Error(`Error sending usage events: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  return { eventsSent: sentCount, totalEvents: allEvents.length }
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
      packages: {},
      customers: {},
      contracts: {},
      usageEvents: null,
      errors: []
    }

    try {
      // Step 1: Create billable metrics for infrastructure SaaS demo
      results.billableMetrics = await createBillableMetrics(apiKey)
    } catch (error) {
      results.errors.push(`Billable metrics: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Step 2: Create products (using existing billable metrics)
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

    try {
      // Step 4: Create packages (depends on rate cards)
      if (Object.keys(results.rateCards).length > 0) {
        results.packages = await createPackages(apiKey, results.rateCards)
      }
    } catch (error) {
      results.errors.push(`Packages: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Step 4.5: Add rates to rate card (must happen before contracts are created with overrides)
      if (Object.keys(results.rateCards).length > 0) {
        const standardRateCardId = results.rateCards['Standard Rate Card']
        if (standardRateCardId) {
          const ratesResult = await addRatesFromCSV(apiKey, standardRateCardId)
          results.ratesAdded = `Successfully added ${ratesResult.ratesSent} rates to rate card "Standard Rate Card"`
          if (ratesResult.errors.length > 0) {
            results.errors.push(`Rates: ${ratesResult.errors.join('; ')}`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`Rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      // Step 5: Create customers and contracts (depends on products, rate cards, and packages)
      if (Object.keys(results.products).length > 0 && Object.keys(results.rateCards).length > 0) {
        const customerResults = await createCustomers(apiKey, results.packages, results.rateCards, results.products)
        results.customers = customerResults.customerIds
        results.contracts = customerResults.contractIds
        
        // Step 6: Generate usage events
        if (Object.keys(customerResults.ingestAliases).length > 0) {
          try {
            const usageResults = await generateUsageEvents(apiKey, customerResults.ingestAliases)
            results.usageEvents = usageResults
          } catch (error) {
            results.errors.push(`Usage events: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`Customers: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
