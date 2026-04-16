import { NextRequest, NextResponse } from 'next/server'
import {
  AI_PLATFORM_RATE_CARD_NAME,
  AI_PLATFORM_RATE_CARDS,
  addAiRatesFromCSV,
  createBillableMetrics,
  createProducts,
  createRateCards,
  ensureFixedProducts,
} from '@/lib/ai-platform-demo'

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
      results.rateCards = await createRateCards(apiKey, AI_PLATFORM_RATE_CARDS)
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
