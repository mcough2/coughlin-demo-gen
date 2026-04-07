import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const METRONOME_API_URL = 'https://api.metronome.com/v1'
const CSV_FILE_PATH = join(process.cwd(), 'data', 'pricebook.csv')

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

async function fetchAllProducts(apiKey: string) {
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

async function findRateCardByName(apiKey: string, rateCardName: string) {
  let nextPage: string | null = null

  while (true) {
    const nextPageParam: string = nextPage ? `&next_page=${nextPage}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/contract-pricing/rate-cards/list?limit=100${nextPageParam}`,
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
      throw new Error(`Failed to fetch rate cards: ${response.statusText}`)
    }

    const responseJson = await response.json()
    const responseData = responseJson.data

    for (const rateCard of responseData) {
      if (rateCard.name === rateCardName) {
        return rateCard.id
      }
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  throw new Error(`Rate card "${rateCardName}" not found`)
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiKey = body.apiKey
    const rateCardName = 'Standard Rate Card' // Hardcoded rate card name
    // Default to January 1st of current year at midnight UTC
    const currentYear = new Date().getFullYear()
    const defaultEffectiveAt = body.defaultEffectiveAt || `${currentYear}-01-01T00:00:00Z`

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    // Read CSV file from project data folder
    const csvText = readFileSync(CSV_FILE_PATH, 'utf-8')

    // Parse CSV
    const csvData = parseCSV(csvText)

    // Fetch products
    const productHash = await fetchAllProducts(apiKey)

    // Find rate card
    const rateCardId = await findRateCardByName(apiKey, rateCardName)

    // Process CSV rates
    const rates = processCSVRates(csvData, productHash, defaultEffectiveAt)

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No valid rates found in CSV' },
        { status: 400 }
      )
    }

    // Add rates to rate card
    const result = await addRatesToRateCard(apiKey, rateCardId, rates)

    return NextResponse.json({
      success: result.errors.length === 0,
      rateCardId,
      totalRates: rates.length,
      ratesSent: result.totalSent,
      errors: result.errors,
      message: result.errors.length === 0
        ? `Successfully added ${result.totalSent} rates to rate card "${rateCardName}"`
        : `Added ${result.totalSent} rates, but ${result.errors.length} batch(es) had errors`
    })
  } catch (error) {
    console.error('Error adding rates:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add rates' },
      { status: 500 }
    )
  }
}
