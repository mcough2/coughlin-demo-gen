import { NextRequest, NextResponse } from 'next/server'

const METRONOME_API_URL = 'https://api.metronome.com/v1'

interface ArchiveResult {
  type: string
  total: number
  archived: number
  errors: string[]
}

async function listAllCustomers(apiKey: string): Promise<Array<{ id: string; ingest_aliases: string[] }>> {
  const customers: Array<{ id: string; ingest_aliases: string[] }> = []
  let nextPage: string | null = null

  while (true) {
    const nextPageParam = nextPage ? `&next_page=${nextPage}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/customers?limit=100${nextPageParam}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.statusText}`)
    }

    const responseJson = await response.json()
    const customerList = responseJson.data || []

    for (const customer of customerList) {
      // Only archive non-archived customers
      if (!customer.archived_at) {
        customers.push({
          id: customer.id,
          ingest_aliases: customer.ingest_aliases || []
        })
      }
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return customers
}

async function removeIngestAliases(apiKey: string, customerId: string): Promise<boolean> {
  try {
    // Try POST /customers/update endpoint
    const response = await fetch(`${METRONOME_API_URL}/customers/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: customerId,
        ingest_aliases: []
      })
    })

    if (response.ok) {
      return true
    }

    // If that doesn't work, try PUT
    const putResponse = await fetch(`${METRONOME_API_URL}/customers/${customerId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ingest_aliases: []
      })
    })

    return putResponse.ok
  } catch (error) {
    // Error removing ingest aliases
    return false
  }
}

async function listAllRateCards(apiKey: string): Promise<string[]> {
  const rateCardIds: string[] = []
  let nextPage: string | null = null

  while (true) {
    const nextPageParam = nextPage ? `&next_page=${nextPage}` : ''
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
    const rateCards = responseJson.data || []

    for (const rateCard of rateCards) {
      rateCardIds.push(rateCard.id)
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return rateCardIds
}

async function listAllProducts(apiKey: string): Promise<string[]> {
  const productIds: string[] = []
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
        body: JSON.stringify({ archive_filter: 'NOT_ARCHIVED' })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`)
    }

    const responseJson = await response.json()
    const products = responseJson.data || []

    for (const product of products) {
      if (!product.archived_at) {
        productIds.push(product.id)
      }
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return productIds
}

async function listAllBillableMetrics(apiKey: string): Promise<string[]> {
  const metricIds: string[] = []
  let nextPage: string | null = null

  while (true) {
    const nextPageParam = nextPage ? `&next_page=${nextPage}` : ''
    const response = await fetch(
      `${METRONOME_API_URL}/billable-metrics?limit=100${nextPageParam}&include_archived=false`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch billable metrics: ${response.statusText}`)
    }

    const responseJson = await response.json()
    const metrics = responseJson.data || []

    for (const metric of metrics) {
      if (!metric.archived_at) {
        metricIds.push(metric.id)
      }
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return metricIds
}

async function listAllPackages(apiKey: string): Promise<string[]> {
  const packageIds: string[] = []
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
      throw new Error(`Failed to fetch packages: ${response.statusText}`)
    }

    const responseJson = await response.json()
    const packages = responseJson.data || []

    for (const pkg of packages) {
      // Packages don't have archived_at, so we archive all
      packageIds.push(pkg.id)
    }

    nextPage = responseJson.next_page || null
    if (!nextPage) break
  }

  return packageIds
}

async function archiveCustomers(apiKey: string, customers: Array<{ id: string; ingest_aliases: string[] }>): Promise<ArchiveResult> {
  let archived = 0
  const errors: string[] = []

  for (const customer of customers) {
    try {
      // First, remove ingest aliases if they exist
      if (customer.ingest_aliases && customer.ingest_aliases.length > 0) {
        const removed = await removeIngestAliases(apiKey, customer.id)
        if (!removed) {
          // Failed to remove ingest aliases, continuing with archive
        }
      }

      // Then archive the customer
      const response = await fetch(
        `${METRONOME_API_URL}/customers/archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: customer.id })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        errors.push(`Customer ${customer.id}: ${response.status} - ${errorText}`)
      } else {
        archived++
      }
    } catch (error) {
      errors.push(`Customer ${customer.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { type: 'customers', total: customers.length, archived, errors }
}

async function archiveRateCards(apiKey: string, rateCardIds: string[]): Promise<ArchiveResult> {
  let archived = 0
  const errors: string[] = []

  for (const rateCardId of rateCardIds) {
    try {
      const response = await fetch(
        `${METRONOME_API_URL}/contract-pricing/rate-cards/archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: rateCardId })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        errors.push(`Rate card ${rateCardId}: ${response.status} - ${errorText}`)
      } else {
        archived++
      }
    } catch (error) {
      errors.push(`Rate card ${rateCardId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { type: 'rate_cards', total: rateCardIds.length, archived, errors }
}

async function archiveProducts(apiKey: string, productIds: string[]): Promise<ArchiveResult> {
  let archived = 0
  const errors: string[] = []

  for (const productId of productIds) {
    try {
      const response = await fetch(
        `${METRONOME_API_URL}/contract-pricing/products/archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ product_id: productId })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        errors.push(`Product ${productId}: ${response.status} - ${errorText}`)
      } else {
        archived++
      }
    } catch (error) {
      errors.push(`Product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { type: 'products', total: productIds.length, archived, errors }
}

async function archiveBillableMetrics(apiKey: string, metricIds: string[]): Promise<ArchiveResult> {
  let archived = 0
  const errors: string[] = []

  for (const metricId of metricIds) {
    try {
      const response = await fetch(
        `${METRONOME_API_URL}/billable-metrics/archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: metricId })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        errors.push(`Billable metric ${metricId}: ${response.status} - ${errorText}`)
      } else {
        archived++
      }
    } catch (error) {
      errors.push(`Billable metric ${metricId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { type: 'billable_metrics', total: metricIds.length, archived, errors }
}

async function archivePackages(apiKey: string, packageIds: string[]): Promise<ArchiveResult> {
  let archived = 0
  const errors: string[] = []

  for (const packageId of packageIds) {
    try {
      // Try archive endpoint
      const response = await fetch(
        `${METRONOME_API_URL}/packages/archive`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: packageId })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: any
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { message: errorText }
        }
        
        // If 404, the package might not exist or might not be archivable - skip silently
        // Packages may not support archiving through the API
        if (response.status === 404) {
          // Package archiving not supported, skipping
          continue
        }
        errors.push(`Package ${packageId}: ${response.status} - ${JSON.stringify(errorData)}`)
      } else {
        archived++
      }
    } catch (error) {
      errors.push(`Package ${packageId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { type: 'packages', total: packageIds.length, archived, errors }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiKey = body.apiKey

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      )
    }

    const results: ArchiveResult[] = []

    // List and archive all objects
    try {
      // 1. Archive all customers (after removing ingest aliases)
      const customers = await listAllCustomers(apiKey)
      if (customers.length > 0) {
        const customerResult = await archiveCustomers(apiKey, customers)
        results.push(customerResult)
      }

      // 2. Archive all rate cards
      const rateCardIds = await listAllRateCards(apiKey)
      if (rateCardIds.length > 0) {
        const rateCardResult = await archiveRateCards(apiKey, rateCardIds)
        results.push(rateCardResult)
      }

      // 3. Archive all products
      const productIds = await listAllProducts(apiKey)
      if (productIds.length > 0) {
        const productResult = await archiveProducts(apiKey, productIds)
        results.push(productResult)
      }

      // 4. Archive all billable metrics
      const metricIds = await listAllBillableMetrics(apiKey)
      if (metricIds.length > 0) {
        const metricResult = await archiveBillableMetrics(apiKey, metricIds)
        results.push(metricResult)
      }

      // 5. Archive all packages
      // NOTE: Packages cannot be archived via API currently - keeping code for future use
      // console.log('Fetching packages...')
      // const packageIds = await listAllPackages(apiKey)
      // console.log(`Found ${packageIds.length} packages to archive`)
      // if (packageIds.length > 0) {
      //   const packageResult = await archivePackages(apiKey, packageIds)
      //   results.push(packageResult)
      // }

      const totalArchived = results.reduce((sum, r) => sum + r.archived, 0)
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
      const allErrors = results.flatMap(r => r.errors)

      return NextResponse.json({
        success: totalErrors === 0,
        results,
        summary: {
          totalArchived,
          totalErrors,
          customersArchived: results.find(r => r.type === 'customers')?.archived || 0,
          rateCardsArchived: results.find(r => r.type === 'rate_cards')?.archived || 0,
          productsArchived: results.find(r => r.type === 'products')?.archived || 0,
          billableMetricsArchived: results.find(r => r.type === 'billable_metrics')?.archived || 0,
          // packagesArchived: results.find(r => r.type === 'packages')?.archived || 0, // Disabled - packages can't be archived
        },
        errors: allErrors,
        message: totalErrors === 0
          ? `Successfully archived ${totalArchived} objects`
          : `Archived ${totalArchived} objects, but ${totalErrors} error(s) occurred`
      })
    } catch (error) {
      console.error('Error during sandbox clear:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to clear sandbox' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error clearing sandbox:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear sandbox' },
      { status: 500 }
    )
  }
}
