import { NextRequest, NextResponse } from 'next/server'
import {
  HYBRID_EXAMPLE_CONTRACT_ID,
  HYBRID_RATE_CARD_NAME,
  addAiRatesFromCSV,
  addHybridSeatSubscriptionRates,
  createBillableMetrics,
  createHybridSeatUsageContract,
  createHybridSeatUsageRateCard,
  createProducts,
  ensureFixedProducts,
  ensureHybridSeatSubscriptionProducts,
} from '@/lib/ai-platform-demo'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUuid(s: string): boolean {
  return UUID_RE.test(s.trim())
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const apiKey = body.apiKey as string | undefined
    const customPricingUnitId = body.customPricingUnitId as string | undefined

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }
    if (!customPricingUnitId || !String(customPricingUnitId).trim()) {
      return NextResponse.json(
        { error: 'customPricingUnitId is required (Metronome custom pricing unit / credit type UUID)' },
        { status: 400 }
      )
    }
    if (!isValidUuid(customPricingUnitId)) {
      return NextResponse.json(
        { error: 'customPricingUnitId must be a valid UUID (from GET /v1/credit-types/list or Metronome UI)' },
        { status: 400 }
      )
    }

    const id = customPricingUnitId.trim()

    const results: {
      referenceHybridContractId: string
      fixedProducts: Record<string, string>
      fixedProductsCreated: string[]
      billableMetrics: Record<string, string>
      products: Record<string, string>
      subscriptionProducts: Record<string, string>
      subscriptionProductsCreated: string[]
      rateCards: Record<string, string>
      ratesAdded?: string
      subscriptionRatesAdded?: string
      hybridContract?: { customerId: string; contractId: string; ingestAlias: string }
      hybridConversion: string
      errors: string[]
    } = {
      referenceHybridContractId: HYBRID_EXAMPLE_CONTRACT_ID,
      fixedProducts: {},
      fixedProductsCreated: [],
      billableMetrics: {},
      products: {},
      subscriptionProducts: {},
      subscriptionProductsCreated: [],
      rateCards: {},
      hybridConversion: '1 AI Credit = $0.01 USD (fiat_per_custom_credit: 1 USD cent per credit)',
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
      results.errors.push(`Usage products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      const sub = await ensureHybridSeatSubscriptionProducts(apiKey)
      results.subscriptionProducts = sub.ids
      results.subscriptionProductsCreated = sub.created
    } catch (error) {
      results.errors.push(`Subscription products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      results.rateCards = await createHybridSeatUsageRateCard(apiKey, id)
    } catch (error) {
      results.errors.push(`Rate cards: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      if (Object.keys(results.rateCards).length > 0 && Object.keys(results.products).length > 0) {
        const rateCardId = results.rateCards[HYBRID_RATE_CARD_NAME]
        if (rateCardId) {
          const ratesResult = await addAiRatesFromCSV(apiKey, rateCardId, id)
          results.ratesAdded = `Successfully added ${ratesResult.ratesSent} usage rates to "${HYBRID_RATE_CARD_NAME}" (AI Credits)`
          if (ratesResult.errors.length > 0) {
            results.errors.push(`Usage rates: ${ratesResult.errors.join('; ')}`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`Usage rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      if (
        Object.keys(results.rateCards).length > 0 &&
        Object.keys(results.subscriptionProducts).length >= 3
      ) {
        const rateCardId = results.rateCards[HYBRID_RATE_CARD_NAME]
        if (rateCardId) {
          const subRates = await addHybridSeatSubscriptionRates(apiKey, rateCardId, results.subscriptionProducts)
          results.subscriptionRatesAdded = `Successfully added ${subRates.ratesSent} subscription (seat) rates in USD cents`
          if (subRates.errors.length > 0) {
            results.errors.push(`Subscription rates: ${subRates.errors.join('; ')}`)
          }
        }
      }
    } catch (error) {
      results.errors.push(`Subscription rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    try {
      const rateCardId = results.rateCards[HYBRID_RATE_CARD_NAME]
      const creditProductId = results.fixedProducts['Credit']
      if (
        rateCardId &&
        creditProductId &&
        results.subscriptionProducts['Good Subscription'] &&
        results.subscriptionProducts['Best Subscription']
      ) {
        results.hybridContract = await createHybridSeatUsageContract(apiKey, {
          rateCardId,
          creditTypeId: id,
          subscriptionProductIds: results.subscriptionProducts,
          creditFixedProductId: creditProductId,
          usageProductIds: results.products,
        })
      }
    } catch (error) {
      results.errors.push(`Hybrid contract: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      message:
        results.errors.length === 0
          ? 'Hybrid Seat+ Usage catalog created: metrics, usage + subscription products, rate card, usage (AI Credits) + seat (USD) rates, and example contract (recurring credits use your credit type id)'
          : 'Some objects were created, but errors occurred',
    })
  } catch (error) {
    console.error('Error generating Hybrid demo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate demo' },
      { status: 500 }
    )
  }
}
