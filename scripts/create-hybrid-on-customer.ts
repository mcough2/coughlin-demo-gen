/**
 * Create the hybrid example contract on an existing customer.
 *
 * Usage:
 *   METRONOME_API_KEY=... npx tsx scripts/create-hybrid-on-customer.ts <customer-uuid>
 *
 * Requires the account to already have hybrid catalog (Hybrid Seat+ Usage rate card, seat SKUs, etc.).
 */

import {
  createHybridSeatUsageContract,
  resolveHybridExampleContractCatalog,
} from '../lib/ai-platform-demo'

async function main() {
  const customerId = process.argv[2]?.trim()
  const apiKey = process.env.METRONOME_API_KEY?.trim()
  if (!apiKey || !customerId) {
    console.error(
      'Usage: METRONOME_API_KEY=... npx tsx scripts/create-hybrid-on-customer.ts <customer-uuid>'
    )
    process.exit(1)
  }

  const catalog = await resolveHybridExampleContractCatalog(apiKey)
  const result = await createHybridSeatUsageContract(apiKey, {
    rateCardId: catalog.rateCardId,
    creditTypeId: catalog.creditTypeId,
    subscriptionProductIds: catalog.subscriptionProductIds,
    creditFixedProductId: catalog.creditFixedProductId,
    usageProductIds: catalog.usageProductIds,
    existingCustomerId: customerId,
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
