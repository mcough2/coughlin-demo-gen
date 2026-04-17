#!/usr/bin/env node
/**
 * Clone a Metronome contract onto another customer.
 *
 * Requires METRONOME_API_KEY with access to both customers.
 * Reads the contract via POST /v2/contracts/get (v1 get is disabled) and creates
 * with POST /v1/contracts/create. You must pass the source customer's UUID
 * (the customer that currently owns the contract).
 *
 * Usage:
 *   METRONOME_API_KEY=... node scripts/clone-metronome-contract.mjs \
 *     --source-customer <uuid> \
 *     --contract <uuid> \
 *     --target-customer <uuid>
 *
 * Optional:
 *   --custom-credit-type-id <uuid>  AI Credits / custom pricing unit (defaults to
 *     9bbde6c7-a1bb-4838-b625-daaa23673dac). Required for correct behavior: v2 GET
 *     returns access_schedule.credit_type as an object; create needs credit_type_id.
 *   --dry-run — print payload only, no POST
 *
 * Seat subscriptions: quantity_management_mode SEAT_BASED; seat_group_key user_id;
 * Good Subscription initial_seat_ids
 * alex_001 … blake_010; Best Subscription dakota_011, skyler_012 (by product id).
 * Credits + recurring_credits with subscription_config get allocation INDIVIDUAL.
 *
 * Payload order: subscriptions before recurring_credits (Metronome resolves
 * subscription_config.subscription_id → subscription.temporary_id). By default,
 * materialized credit *segments* from GET are omitted — v1 create does not attach
 * subscription_config to line-item credits; use --include-cloned-credit-segments to
 * send them (usually unnecessary; recurring_credits define subscription linkage).
 */

import crypto from 'crypto'

const BASE_V1 = 'https://api.metronome.com/v1'
const BASE_V2 = 'https://api.metronome.com/v2'

const REMOVE_KEYS = new Set([
  'id',
  'created_at',
  'created_by',
  'ledger',
  'balance',
  'archived_at',
  'amendments',
  'initial',
  'json',
  'applicable_contract_ids',
  'recurring_credit_id',
  'recurring_commit_id',
  'billing_periods',
  'has_more',
])

function toIso(v) {
  if (v == null) return undefined
  if (typeof v === 'string') {
    if (v.startsWith('0001-')) return undefined
    return v
  }
  if (typeof v === 'number') return new Date(v).toISOString()
  return v
}

function deepStrip(obj) {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(deepStrip)
  if (typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (REMOVE_KEYS.has(k)) continue
    out[k] = deepStrip(v)
  }
  return out
}

function normalizeProductRefs(node) {
  if (node === null || node === undefined) return node
  if (Array.isArray(node)) {
    return node.map(normalizeProductRefs)
  }
  if (typeof node !== 'object') return node
  const copy = { ...node }
  if (copy.product && typeof copy.product === 'object' && copy.product.id) {
    copy.product_id = copy.product.id
    delete copy.product
  }
  if (copy.subscription_rate?.product?.id) {
    copy.subscription_rate = {
      ...copy.subscription_rate,
      product_id: copy.subscription_rate.product.id,
    }
    delete copy.subscription_rate.product
  }
  for (const k of Object.keys(copy)) {
    copy[k] = normalizeProductRefs(copy[k])
  }
  return copy
}

function stripNestedContractIds(node) {
  if (node === null || node === undefined) return node
  if (Array.isArray(node)) return node.map(stripNestedContractIds)
  if (typeof node !== 'object') return node
  const copy = { ...node }
  if (copy.contract && typeof copy.contract === 'object' && copy.contract.id) {
    delete copy.contract
  }
  if (copy.invoice_contract && typeof copy.invoice_contract === 'object') {
    delete copy.invoice_contract
  }
  for (const k of Object.keys(copy)) {
    copy[k] = stripNestedContractIds(copy[k])
  }
  return copy
}

/**
 * @param {object} d – v2 `data` contract object (flat), or v1 `data.current`
 */
/** v2 contract GET returns access_schedule.credit_type: { id, name }; create expects access_schedule.credit_type_id. */
const DEFAULT_CUSTOM_CREDIT_TYPE_ID = '9bbde6c7-a1bb-4838-b625-daaa23673dac'

/** Demo catalog product ids (Hybrid seat SKUs) — used to pick default seat user_id lists */
const GOOD_SUBSCRIPTION_PRODUCT_ID = '1d21a6c8-074f-41ac-b2b2-afd854e09be9'
const BEST_SUBSCRIPTION_PRODUCT_ID = 'c3c3191c-9080-44fa-aa8b-9a0782356634'

const GOOD_SUBSCRIPTION_INITIAL_SEAT_USER_IDS = [
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

const BEST_SUBSCRIPTION_INITIAL_SEAT_USER_IDS = ['dakota_011', 'skyler_012']

function normalizeCreditTypeForCreate(snap, customCreditTypeId) {
  const fallback = customCreditTypeId || DEFAULT_CUSTOM_CREDIT_TYPE_ID

  for (const c of snap.credits || []) {
    const as = c.access_schedule
    if (!as) continue
    if (as.credit_type?.id) {
      as.credit_type_id = as.credit_type.id
      delete as.credit_type
    }
    if (!as.credit_type_id && fallback) {
      as.credit_type_id = fallback
    }
    // Seat-linked credits: per-seat burn requires INDIVIDUAL allocation
    if (c.subscription_config) {
      c.subscription_config.allocation = 'INDIVIDUAL'
    }
    if ('type' in c) delete c.type
  }

  for (const rc of snap.recurring_credits || []) {
    const aa = rc.access_amount
    if (aa) {
      if (aa.credit_type?.id) {
        aa.credit_type_id = aa.credit_type.id
        delete aa.credit_type
      }
      if (!aa.credit_type_id && fallback) {
        aa.credit_type_id = fallback
      }
    }
    if (rc.subscription_config) {
      rc.subscription_config.allocation = 'INDIVIDUAL'
    }
  }
}

/**
 * Stable temporary ids (Metronome docs use strings like "team_plan_annual" for
 * subscription_config.subscription_id cross-references in the same payload).
 */
function temporaryIdForSubscription(sub) {
  const pid = sub.subscription_rate?.product_id
  if (pid === GOOD_SUBSCRIPTION_PRODUCT_ID) return 'tmpsub-hybrid-good'
  if (pid === BEST_SUBSCRIPTION_PRODUCT_ID) return 'tmpsub-hybrid-best'
  return crypto.randomUUID()
}

function wireSubscriptionTemporaryIds(snap) {
  const subs = snap.subscriptions
  if (!Array.isArray(subs) || subs.length === 0) return

  const oldToTemp = new Map()
  for (const sub of subs) {
    if (sub.id) {
      const temp = temporaryIdForSubscription(sub)
      oldToTemp.set(sub.id, temp)
      sub.temporary_id = temp
      delete sub.id
    }
  }

  const rewriteConfig = (cfg) => {
    if (!cfg?.subscription_id) return
    const t = oldToTemp.get(cfg.subscription_id)
    if (t) cfg.subscription_id = t
  }

  for (const c of snap.credits || []) {
    rewriteConfig(c.subscription_config)
  }
  for (const rc of snap.recurring_credits || []) {
    rewriteConfig(rc.subscription_config)
  }
}

function buildCreatePayloadFromContractSnapshot(d, targetCustomerId, extra = {}) {
  // Lift product.id → product_id before deepStrip removes nested ids
  const snap = normalizeProductRefs(JSON.parse(JSON.stringify(d)))
  wireSubscriptionTemporaryIds(snap)
  normalizeCreditTypeForCreate(snap, extra.customCreditTypeId)

  const subscriptions = deepStrip(extra.subscriptions || snap.subscriptions || [])
  const commits = deepStrip(snap.commits || [])
  const recurring_commits = deepStrip(snap.recurring_commits || [])
  const recurring_credits = deepStrip(snap.recurring_credits || [])
  // v1 contracts/create does not model subscription_config on line-item credits; cloned
  // materialized segments from GET often show as disconnected. Omit unless requested.
  const credits =
    extra.includeClonedCreditSegments === true ? deepStrip(snap.credits || []) : []
  const overrides = deepStrip(snap.overrides || [])
  const scheduled_charges = deepStrip(snap.scheduled_charges || [])
  const discounts = deepStrip(snap.discounts || [])
  const professional_services = deepStrip(snap.professional_services || [])
  const reseller_royalties = deepStrip(snap.reseller_royalties || [])
  const hierarchy_configuration = deepStrip(snap.hierarchy_configuration || undefined)
  const usage_filter = deepStrip(snap.usage_filter || undefined)
  const usage_statement_schedule = deepStrip(snap.usage_statement_schedule || undefined)
  const prepaid_balance_threshold_configuration = deepStrip(
    snap.prepaid_balance_threshold_configuration || undefined
  )
  const spend_threshold_configuration = deepStrip(snap.spend_threshold_configuration || undefined)

  // Subscriptions BEFORE recurring_credits/credits so subscription_id → temporary_id resolves.
  let body = {
    customer_id: targetCustomerId,
    starting_at: toIso(snap.starting_at),
    ending_before: snap.ending_before ? toIso(snap.ending_before) : undefined,
    name: snap.name || undefined,
    net_payment_terms_days: snap.net_payment_terms_days ?? undefined,
    rate_card_id: snap.rate_card_id || undefined,
    subscriptions,
    commits,
    recurring_commits,
    recurring_credits,
    credits,
    overrides,
    scheduled_charges,
    discounts,
    professional_services,
    reseller_royalties,
    hierarchy_configuration,
    usage_filter,
    usage_statement_schedule,
    prepaid_balance_threshold_configuration,
    spend_threshold_configuration,
    multiplier_override_prioritization: snap.multiplier_override_prioritization || undefined,
    scheduled_charges_on_usage_invoices: snap.scheduled_charges_on_usage_invoices || undefined,
    total_contract_value: snap.total_contract_value ?? undefined,
    custom_fields: extra.custom_fields ?? snap.custom_fields ?? undefined,
    uniqueness_key: crypto.randomUUID(),
  }

  const billingSrc = snap.customer_billing_provider_configuration
  if (billingSrc) {
    body.billing_provider_configuration = deepStrip(billingSrc)
  }

  body = stripNestedContractIds(body)

  const dropEmptyContract = (arr) => {
    if (!Array.isArray(arr)) return
    for (const row of arr) {
      if (row.contract && typeof row.contract === 'object' && Object.keys(row.contract).length === 0) {
        delete row.contract
      }
    }
  }
  dropEmptyContract(body.credits)
  dropEmptyContract(body.recurring_credits)
  dropEmptyContract(body.commits)

  for (const k of Object.keys(body)) {
    if (body[k] === undefined) delete body[k]
    if (Array.isArray(body[k]) && body[k].length === 0) delete body[k]
  }

  if (Array.isArray(body.subscriptions)) {
    for (const s of body.subscriptions) {
      s.quantity_management_mode = 'SEAT_BASED'
      if (!s.seat_config) s.seat_config = {}
      s.seat_config.seat_group_key = 'user_id'
      const pid = s.subscription_rate?.product_id
      if (pid === GOOD_SUBSCRIPTION_PRODUCT_ID) {
        s.seat_config.initial_seat_ids = [...GOOD_SUBSCRIPTION_INITIAL_SEAT_USER_IDS]
      } else if (pid === BEST_SUBSCRIPTION_PRODUCT_ID) {
        s.seat_config.initial_seat_ids = [...BEST_SUBSCRIPTION_INITIAL_SEAT_USER_IDS]
      } else if (s.seat_config.initial_seat_ids === undefined) {
        s.seat_config.initial_seat_ids = []
      }
    }
  }

  for (const c of body.credits || []) {
    if (c.subscription_config) {
      c.subscription_config.allocation = 'INDIVIDUAL'
    }
  }
  for (const rc of body.recurring_credits || []) {
    if (rc.subscription_config) {
      rc.subscription_config.allocation = 'INDIVIDUAL'
    }
  }

  if (body.usage_statement_schedule?.billing_anchor_date && !body.usage_statement_schedule.day) {
    body.usage_statement_schedule.day = 'CUSTOM_DATE'
  }

  if (Array.isArray(body.overrides)) {
    for (const o of body.overrides) {
      if (o.override_specifiers?.length && o.product_id) {
        delete o.product_id
      }
      if (o.is_commit_specific === false && o.target !== undefined) {
        delete o.target
      }
    }
  }

  return body
}

function buildCreatePayload(getResponse, targetCustomerId, options = {}) {
  const root = getResponse.data ?? getResponse
  // v1 shape: nested current/initial
  if (root.current) {
    return buildCreatePayloadFromContractSnapshot(root.current, targetCustomerId, {
      subscriptions: root.subscriptions,
      custom_fields: root.custom_fields,
      customCreditTypeId: options.customCreditTypeId,
      includeClonedCreditSegments: options.includeClonedCreditSegments,
    })
  }
  // v2 shape: flat contract on data
  return buildCreatePayloadFromContractSnapshot(root, targetCustomerId, {
    customCreditTypeId: options.customCreditTypeId,
    includeClonedCreditSegments: options.includeClonedCreditSegments,
  })
}

function parseArgs() {
  const a = process.argv.slice(2)
  const out = { dryRun: false }
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--dry-run') out.dryRun = true
    else if (a[i] === '--source-customer') out.sourceCustomer = a[++i]
    else if (a[i] === '--contract') out.contractId = a[++i]
    else if (a[i] === '--target-customer') out.targetCustomer = a[++i]
    else if (a[i] === '--custom-credit-type-id') out.customCreditTypeId = a[++i]
    else if (a[i] === '--include-cloned-credit-segments') out.includeClonedCreditSegments = true
  }
  if (!out.sourceCustomer || !out.contractId || !out.targetCustomer) {
    console.error(
      'Usage: METRONOME_API_KEY=... node scripts/clone-metronome-contract.mjs --source-customer <uuid> --contract <uuid> --target-customer <uuid> [--custom-credit-type-id <uuid>] [--include-cloned-credit-segments] [--dry-run]'
    )
    process.exit(1)
  }
  return out
}

async function main() {
  const key = process.env.METRONOME_API_KEY
  if (!key) {
    console.error('Set METRONOME_API_KEY')
    process.exit(1)
  }

  const {
    sourceCustomer,
    contractId,
    targetCustomer,
    dryRun,
    customCreditTypeId,
    includeClonedCreditSegments,
  } = parseArgs()

  const getRes = await fetch(`${BASE_V2}/contracts/get`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contract_id: contractId,
      customer_id: sourceCustomer,
    }),
  })
  const getJson = await getRes.json()
  if (!getRes.ok) {
    console.error('contracts/get failed:', getRes.status, JSON.stringify(getJson))
    process.exit(1)
  }

  const payload = buildCreatePayload(getJson, targetCustomer, {
    customCreditTypeId,
    includeClonedCreditSegments,
  })

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2))
    return
  }

  const createRes = await fetch(`${BASE_V1}/contracts/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const createJson = await createRes.json()
  if (!createRes.ok) {
    console.error('contracts/create failed:', createRes.status, JSON.stringify(createJson))
    process.exit(1)
  }
  console.log('Created contract:', createJson.data?.id ?? createJson)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
