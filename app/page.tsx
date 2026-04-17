'use client'

import { useState } from 'react'

type DemoType = 'ai-token' | 'infra-saas' | 'hybrid-seat' | null

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [selectedDemoType, setSelectedDemoType] = useState<DemoType>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generationResult, setGenerationResult] = useState<any>(null)
  const [clearingSandbox, setClearingSandbox] = useState(false)
  const [clearSandboxResult, setClearSandboxResult] = useState<any>(null)
  /** Metronome custom pricing unit (credit type) UUID for Hybrid — from GET /v1/credit-types/list or UI */
  const [hybridPricingUnitId, setHybridPricingUnitId] = useState('')

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) {
      setError('Please enter your Metronome API key')
      return
    }
    setError('')
    // API key is stored in state, ready for demo generation
  }

  const handleDemoTypeSelect = (type: DemoType) => {
    if (!apiKey.trim()) {
      setError('Please enter your API key first')
      return
    }
    setSelectedDemoType(type)
    setError('')
    setGenerationResult(null)
    setClearSandboxResult(null)
    
    // Scroll to next steps section after a short delay
    setTimeout(() => {
      const nextStepsElement = document.getElementById('next-steps-section')
      if (nextStepsElement) {
        nextStepsElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto',
    }}>
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '0.5rem',
        textAlign: 'center',
        color: '#1C1C1C',
      }}>
        Metronome Demo Generator
      </h1>
      <p style={{
        marginBottom: '3rem',
        color: '#1C1C1C',
        textAlign: 'center',
        fontSize: '1.1rem',
        opacity: 0.7,
      }}>
        Generate demos for your Metronome account
      </p>

      {/* API Key Input */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        marginBottom: '3rem',
        padding: '2rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: '1px solid #E0E0E0',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#1C1C1C',
        }}>
          Step 1: Enter Your API Key
        </h2>
        <form onSubmit={handleApiKeySubmit}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setError('')
            }}
            placeholder="Enter your Metronome API key"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #E0E0E0',
              borderRadius: '8px',
              fontFamily: 'inherit',
              marginBottom: '0.5rem',
              backgroundColor: '#FFFFFF',
              color: '#1C1C1C',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: '#6DC64B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5AB83A'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6DC64B'}
          >
            Save API Key
          </button>
        </form>
        {apiKey && (
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: '#6DC64B',
            fontStyle: 'italic',
            fontWeight: '500',
          }}>
            ✓ API key saved
          </p>
        )}
      </div>

      {/* Demo Type Selection */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#1C1C1C',
        }}>
          Step 2: Select Demo Type
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* AI Platform Demo */}
          <button
            onClick={() => handleDemoTypeSelect('ai-token')}
            disabled={!apiKey.trim() || loading}
            style={{
              padding: '2rem',
              backgroundColor: selectedDemoType === 'ai-token' ? '#DFF0D8' : '#FFFFFF',
              border: `3px solid ${selectedDemoType === 'ai-token' ? '#6DC64B' : '#E0E0E0'}`,
              borderRadius: '12px',
              cursor: apiKey.trim() && !loading ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: apiKey.trim() ? 1 : 0.6,
              boxShadow: selectedDemoType === 'ai-token' ? '0 4px 12px rgba(109, 198, 75, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1C1C1C',
            }}>
              🤖 AI Platform
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#1C1C1C',
              lineHeight: '1.5',
              opacity: 0.7,
            }}>
              An API platform company provides developers with tools and infrastructure to build, manage, and scale applications by exposing core functionality and data through APIs.
            </div>
            {selectedDemoType === 'ai-token' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#6DC64B',
                color: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: '600',
              }}>
                Selected
              </div>
            )}
          </button>

          {/* Infra SaaS Demo */}
          <button
            onClick={() => handleDemoTypeSelect('infra-saas')}
            disabled={!apiKey.trim() || loading}
            style={{
              padding: '2rem',
              backgroundColor: selectedDemoType === 'infra-saas' ? '#DFF0D8' : '#FFFFFF',
              border: `3px solid ${selectedDemoType === 'infra-saas' ? '#6DC64B' : '#E0E0E0'}`,
              borderRadius: '12px',
              cursor: apiKey.trim() && !loading ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: apiKey.trim() ? 1 : 0.6,
              boxShadow: selectedDemoType === 'infra-saas' ? '0 4px 12px rgba(109, 198, 75, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => {
              if (apiKey.trim() && !loading && selectedDemoType !== 'infra-saas') {
                e.currentTarget.style.backgroundColor = '#F0F8F0'
                e.currentTarget.style.borderColor = '#A6D96A'
              }
            }}
            onMouseLeave={(e) => {
              if (selectedDemoType !== 'infra-saas') {
                e.currentTarget.style.backgroundColor = '#FFFFFF'
                e.currentTarget.style.borderColor = '#E0E0E0'
              }
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1C1C1C',
            }}>
              🏗️ Infra SaaS
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#1C1C1C',
              lineHeight: '1.5',
              opacity: 0.7,
            }}>
              Generate a demo with infrastructure SaaS billing model. Perfect for infrastructure services with usage-based pricing.
            </div>
            {selectedDemoType === 'infra-saas' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#6DC64B',
                color: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: '600',
                pointerEvents: 'none',
              }}>
                ✓ Selected
              </div>
            )}
          </button>

          {/* Hybrid Seat+ Usage Demo */}
          <button
            onClick={() => handleDemoTypeSelect('hybrid-seat')}
            disabled={!apiKey.trim() || loading}
            style={{
              padding: '2rem',
              backgroundColor: selectedDemoType === 'hybrid-seat' ? '#DFF0D8' : '#FFFFFF',
              border: `3px solid ${selectedDemoType === 'hybrid-seat' ? '#6DC64B' : '#E0E0E0'}`,
              borderRadius: '12px',
              cursor: apiKey.trim() && !loading ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: apiKey.trim() ? 1 : 0.6,
              boxShadow: selectedDemoType === 'hybrid-seat' ? '0 4px 12px rgba(109, 198, 75, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#1C1C1C',
            }}>
              👥 Hybrid Seat+ Usage
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#1C1C1C',
              lineHeight: '1.55',
              opacity: 0.75,
            }}>
              Same catalog as AI Platform; usage rates use your <strong style={{ fontWeight: 600 }}>AI Credits</strong> pricing unit (1 credit = $0.01 USD). Create the unit in Metronome, then paste its UUID when you generate. See README.
            </div>
            {selectedDemoType === 'hybrid-seat' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#6DC64B',
                color: '#FFFFFF',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: '600',
              }}>
                Selected
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#FFE5E5',
          color: '#C00',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '600px',
          border: '1px solid #FFB3B3',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Next Steps (when demo type is selected) */}
      {selectedDemoType && (
        <div 
          id="next-steps-section"
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#DFF0D8',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            border: '2px solid #6DC64B',
            animation: 'fadeIn 0.3s ease-in',
          }}
        >
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: '#1C1C1C',
          }}>
            {selectedDemoType === 'infra-saas'
              ? 'Generate Infra SaaS Demo'
              : selectedDemoType === 'ai-token'
                ? 'Generate AI Platform Demo'
                : selectedDemoType === 'hybrid-seat'
                  ? 'Generate Hybrid Seat+ Usage Demo'
                  : 'Next Steps'}
          </h3>
          
          {selectedDemoType === 'infra-saas' ? (
            <div>
              <p style={{
                color: '#1C1C1C',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '1.5rem',
              }}>
                This will create billable metrics, products, and rate cards for an infrastructure SaaS demo, then add rates from the predefined pricebook.csv file to the Standard Rate Card.
              </p>
              <button
                onClick={async () => {
                  setLoading(true)
                  setError('')
                  setGenerationResult(null)
                  
                  try {
                    // Generate demo objects (includes adding rates to rate card)
                    const generateRes = await fetch('/api/infra-saas/generate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ apiKey }),
                    })
                    
                    const generateData = await generateRes.json()
                    
                    if (!generateRes.ok) {
                      throw new Error(generateData.error || 'Failed to generate demo objects')
                    }
                    
                    setGenerationResult(generateData)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || !apiKey.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: loading ? '#A6D96A' : '#6DC64B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || !apiKey.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
              >
                {loading ? 'Generating Demo...' : 'Generate Infra SaaS Demo'}
              </button>
              
              {generationResult && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: generationResult.success ? '#DFF0D8' : '#FFE5E5',
                  borderRadius: '8px',
                  border: `1px solid ${generationResult.success ? '#6DC64B' : '#FFB3B3'}`,
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#1C1C1C',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                  }}>
                    {generationResult.success ? '✓ Demo Generated Successfully' : '⚠ Partial Success'}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#1C1C1C',
                    opacity: 0.8,
                    lineHeight: '1.8',
                  }}>
                    {generationResult.results && (
                      <>
                        {generationResult.results.billableMetrics && Object.keys(generationResult.results.billableMetrics).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.billableMetrics).length} billable metric{Object.keys(generationResult.results.billableMetrics).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.products && Object.keys(generationResult.results.products).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.products).length} product{Object.keys(generationResult.results.products).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.rateCards && Object.keys(generationResult.results.rateCards).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.rateCards).length} rate card{Object.keys(generationResult.results.rateCards).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.ratesAdded && (
                          <div>• {generationResult.results.ratesAdded}</div>
                        )}
                        {generationResult.results.customers && Object.keys(generationResult.results.customers).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.customers).length} customer{Object.keys(generationResult.results.customers).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.contracts && Object.keys(generationResult.results.contracts).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.contracts).length} contract{Object.keys(generationResult.results.contracts).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.usageEvents && (
                          <div>• Generated {generationResult.results.usageEvents.eventsSent || 0} usage event{generationResult.results.usageEvents.eventsSent !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.errors && generationResult.results.errors.length > 0 && (
                          <div style={{ marginTop: '0.5rem', color: '#C00' }}>
                            <strong>Errors:</strong>
                            <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                              {generationResult.results.errors.map((err: string, idx: number) => (
                                <li key={idx} style={{ fontSize: '0.8rem' }}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          ) : selectedDemoType === 'ai-token' ? (
            <div>
              <p style={{
                color: '#1C1C1C',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '1.5rem',
              }}>
                This ensures five fixed products exist (matched by name, type fixed: Prepaid Commit, Postpaid Commit, Credit, Trial Credit, SLA Credit), creates six billable metrics (input and output tokens for Code Assist, Chat, and Voice), matching usage products (with token-to-million-tokens quantity conversion), an “AI Platform Standard Rate Card,” and rates from <code style={{ fontSize: '0.9em' }}>data/ai-pricebook.csv</code>. Contracts and usage ingest are not part of this step.
              </p>
              <button
                onClick={async () => {
                  setLoading(true)
                  setError('')
                  setGenerationResult(null)

                  try {
                    const generateRes = await fetch('/api/ai-platform/generate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ apiKey }),
                    })

                    const generateData = await generateRes.json()

                    if (!generateRes.ok) {
                      throw new Error(generateData.error || 'Failed to generate AI Platform objects')
                    }

                    setGenerationResult(generateData)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || !apiKey.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: loading ? '#A6D96A' : '#6DC64B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || !apiKey.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
              >
                {loading ? 'Generating...' : 'Generate AI Platform Demo'}
              </button>

              {generationResult && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: generationResult.success ? '#DFF0D8' : '#FFE5E5',
                  borderRadius: '8px',
                  border: `1px solid ${generationResult.success ? '#6DC64B' : '#FFB3B3'}`,
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#1C1C1C',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                  }}>
                    {generationResult.success ? '✓ AI Platform objects created' : '⚠ Partial Success'}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#1C1C1C',
                    opacity: 0.8,
                    lineHeight: '1.8',
                  }}>
                    {generationResult.results && (
                      <>
                        {generationResult.results.fixedProducts && Object.keys(generationResult.results.fixedProducts).length > 0 && (
                          <div>
                            • Fixed products: {Object.keys(generationResult.results.fixedProducts).length} ensured by name (type=fixed)
                            {Array.isArray(generationResult.results.fixedProductsCreated) && generationResult.results.fixedProductsCreated.length > 0
                              ? ` — ${generationResult.results.fixedProductsCreated.length} newly created`
                              : ''}
                          </div>
                        )}
                        {generationResult.results.billableMetrics && Object.keys(generationResult.results.billableMetrics).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.billableMetrics).length} billable metric{Object.keys(generationResult.results.billableMetrics).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.products && Object.keys(generationResult.results.products).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.products).length} usage product{Object.keys(generationResult.results.products).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.rateCards && Object.keys(generationResult.results.rateCards).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.rateCards).length} rate card{Object.keys(generationResult.results.rateCards).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.ratesAdded && (
                          <div>• {generationResult.results.ratesAdded}</div>
                        )}
                        {generationResult.results.errors && generationResult.results.errors.length > 0 && (
                          <div style={{ marginTop: '0.5rem', color: '#C00' }}>
                            <strong>Errors:</strong>
                            <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                              {generationResult.results.errors.map((err: string, idx: number) => (
                                <li key={idx} style={{ fontSize: '0.8rem' }}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : selectedDemoType === 'hybrid-seat' ? (
            <div>
              <p style={{
                color: '#1C1C1C',
                lineHeight: '1.6',
                opacity: 0.8,
                marginBottom: '1rem',
              }}>
                Creates fixed catalog products, six token metrics, usage products, <strong style={{ fontWeight: 600 }}>Good / Better / Best Subscription</strong> seat SKUs, a rate card (usage from <code style={{ fontSize: '0.9em' }}>data/ai-pricebook.csv</code> in your AI Credits unit; seats in USD cents), and an <strong style={{ fontWeight: 600 }}>example contract</strong> (enterprise customer) with <strong style={{ fontWeight: 600 }}>Better</strong> and <strong style={{ fontWeight: 600 }}>Best</strong> seat subscriptions only, each with one monthly recurring credit using <strong style={{ fontWeight: 600 }}>your custom pricing unit</strong> as <code style={{ fontSize: '0.9em' }}>credit_type_id</code> (<strong style={{ fontWeight: 600 }}>1200</strong> and <strong style={{ fontWeight: 600 }}>2500</strong> AI Credits per seat per month). Conversion is fixed at <strong style={{ fontWeight: 600 }}>1 AI Credit = $0.01 USD</strong>. Paste your custom pricing unit UUID (create “AI Credits” in Metronome first; list IDs via GET /v1/credit-types/list).
              </p>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#1C1C1C',
                marginBottom: '0.35rem',
                fontWeight: '600',
              }}>
                Custom pricing unit ID (UUID)
              </label>
              <input
                type="text"
                value={hybridPricingUnitId}
                onChange={(e) => setHybridPricingUnitId(e.target.value)}
                placeholder="e.g. 9bbde6c7-a1bb-4838-b625-daaa23673dac"
                autoComplete="off"
                spellCheck={false}
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.9rem',
                  fontFamily: 'ui-monospace, monospace',
                  borderRadius: '8px',
                  border: '1px solid #CCC',
                  marginBottom: '1.25rem',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={async () => {
                  setLoading(true)
                  setError('')
                  setGenerationResult(null)

                  try {
                    const generateRes = await fetch('/api/hybrid/generate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        apiKey,
                        customPricingUnitId: hybridPricingUnitId.trim(),
                      }),
                    })

                    const generateData = await generateRes.json()

                    if (!generateRes.ok) {
                      throw new Error(generateData.error || 'Failed to generate Hybrid demo')
                    }

                    setGenerationResult(generateData)
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'An error occurred')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading || !apiKey.trim() || !hybridPricingUnitId.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  backgroundColor: loading ? '#A6D96A' : '#6DC64B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading || !apiKey.trim() || !hybridPricingUnitId.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'background-color 0.2s',
                }}
              >
                {loading ? 'Generating...' : 'Generate Hybrid Seat+ Usage Demo'}
              </button>

              {generationResult && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  backgroundColor: generationResult.success ? '#DFF0D8' : '#FFE5E5',
                  borderRadius: '8px',
                  border: `1px solid ${generationResult.success ? '#6DC64B' : '#FFB3B3'}`,
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#1C1C1C',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                  }}>
                    {generationResult.success ? '✓ Hybrid catalog created' : '⚠ Partial Success'}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#1C1C1C',
                    opacity: 0.8,
                    lineHeight: '1.8',
                  }}>
                    {generationResult.results && (
                      <>
                        {generationResult.results.hybridConversion && (
                          <div>• Conversion: {generationResult.results.hybridConversion}</div>
                        )}
                        {generationResult.results.fixedProducts && Object.keys(generationResult.results.fixedProducts).length > 0 && (
                          <div>
                            • Fixed products: {Object.keys(generationResult.results.fixedProducts).length} ensured by name
                            {Array.isArray(generationResult.results.fixedProductsCreated) && generationResult.results.fixedProductsCreated.length > 0
                              ? ` — ${generationResult.results.fixedProductsCreated.length} newly created`
                              : ''}
                          </div>
                        )}
                        {generationResult.results.billableMetrics && Object.keys(generationResult.results.billableMetrics).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.billableMetrics).length} billable metric{Object.keys(generationResult.results.billableMetrics).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.products && Object.keys(generationResult.results.products).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.products).length} usage product{Object.keys(generationResult.results.products).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.subscriptionProducts &&
                          Object.keys(generationResult.results.subscriptionProducts).length > 0 && (
                          <div>
                            • Seat subscriptions: {Object.keys(generationResult.results.subscriptionProducts).length} ensured
                            {Array.isArray(generationResult.results.subscriptionProductsCreated) &&
                            generationResult.results.subscriptionProductsCreated.length > 0
                              ? ` — ${generationResult.results.subscriptionProductsCreated.length} newly created`
                              : ''}
                          </div>
                        )}
                        {generationResult.results.rateCards && Object.keys(generationResult.results.rateCards).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.rateCards).length} rate card{Object.keys(generationResult.results.rateCards).length !== 1 ? 's' : ''}</div>
                        )}
                        {generationResult.results.ratesAdded && (
                          <div>• {generationResult.results.ratesAdded}</div>
                        )}
                        {generationResult.results.subscriptionRatesAdded && (
                          <div>• {generationResult.results.subscriptionRatesAdded}</div>
                        )}
                        {generationResult.results.packages &&
                          Object.keys(generationResult.results.packages).length > 0 && (
                          <div>
                            • Packages created: {Object.keys(generationResult.results.packages).length}{' '}
                            (Good/Better/Best × Monthly/Annual — recurring credits use fixed Credit + your credit type)
                          </div>
                        )}
                        {generationResult.results.referenceHybridContractId && (
                          <div>
                            • Reference hybrid contract (verified pattern):{' '}
                            <code style={{ fontSize: '0.85em' }}>{generationResult.results.referenceHybridContractId}</code>
                          </div>
                        )}
                        {generationResult.results.hybridContract && (
                          <div>
                            • New demo contract:{' '}
                            <code style={{ fontSize: '0.85em' }}>{generationResult.results.hybridContract.contractId}</code>
                            {' '}(customer{' '}
                            <code style={{ fontSize: '0.85em' }}>{generationResult.results.hybridContract.customerId}</code>
                            , ingest <code style={{ fontSize: '0.85em' }}>{generationResult.results.hybridContract.ingestAlias}</code>)
                          </div>
                        )}
                        {generationResult.results.errors && generationResult.results.errors.length > 0 && (
                          <div style={{ marginTop: '0.5rem', color: '#C00' }}>
                            <strong>Errors:</strong>
                            <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem' }}>
                              {generationResult.results.errors.map((err: string, idx: number) => (
                                <li key={idx} style={{ fontSize: '0.8rem' }}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Clear Sandbox Button - Bottom of Page */}
      {apiKey && (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          marginTop: '4rem',
          marginBottom: '2rem',
          padding: '1.5rem',
          backgroundColor: '#FFF5F5',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '2px solid #FF6B6B',
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '0.75rem',
            color: '#C00',
            fontWeight: '600',
          }}>
            ⚠️ Clear Sandbox
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: '#1C1C1C',
            opacity: 0.8,
            marginBottom: '1rem',
            lineHeight: '1.5',
          }}>
            This will archive all customers, packages, rate cards, products, and billable metrics in your account. This action cannot be undone.
          </p>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to clear the sandbox? This will archive all customers, packages, rate cards, products, and billable metrics. This action cannot be undone.')) {
                return
              }

              setClearingSandbox(true)
              setError('')
              setClearSandboxResult(null)

              try {
                const res = await fetch('/api/sandbox/clear', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ apiKey }),
                })

                const data = await res.json()

                if (!res.ok) {
                  throw new Error(data.error || 'Failed to clear sandbox')
                }

                setClearSandboxResult(data)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
              } finally {
                setClearingSandbox(false)
              }
            }}
            disabled={clearingSandbox || !apiKey.trim()}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: clearingSandbox ? '#FF9999' : '#FF6B6B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: clearingSandbox || !apiKey.trim() ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!clearingSandbox && apiKey.trim()) {
                e.currentTarget.style.backgroundColor = '#FF5252'
              }
            }}
            onMouseLeave={(e) => {
              if (!clearingSandbox) {
                e.currentTarget.style.backgroundColor = '#FF6B6B'
              }
            }}
          >
            {clearingSandbox ? 'Clearing Sandbox...' : 'Clear Sandbox'}
          </button>

          {clearSandboxResult && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: clearSandboxResult.success ? '#DFF0D8' : '#FFE5E5',
              borderRadius: '8px',
              border: `1px solid ${clearSandboxResult.success ? '#6DC64B' : '#FFB3B3'}`,
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#1C1C1C',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}>
                {clearSandboxResult.success ? '✓ Sandbox Cleared!' : '⚠ Partial Success'}
              </div>
              {clearSandboxResult.summary && (
                <div style={{
                  fontSize: '0.85rem',
                  color: '#1C1C1C',
                  opacity: 0.8,
                  lineHeight: '1.6',
                  marginBottom: '0.5rem',
                }}>
                  <div><strong>Total Archived:</strong> {clearSandboxResult.summary.totalArchived} objects</div>
                  <div style={{ marginTop: '0.25rem' }}>
                    • Customers: {clearSandboxResult.summary.customersArchived}
                  </div>
                  <div>
                    • Packages: {clearSandboxResult.summary.packagesArchived ?? 0}
                  </div>
                  <div>
                    • Rate Cards: {clearSandboxResult.summary.rateCardsArchived}
                  </div>
                  <div>
                    • Products: {clearSandboxResult.summary.productsArchived}
                  </div>
                  <div>
                    • Billable Metrics: {clearSandboxResult.summary.billableMetricsArchived}
                  </div>
                </div>
              )}
              {clearSandboxResult.errors && clearSandboxResult.errors.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <strong>Errors:</strong>
                  <ul style={{ marginTop: '0.25rem', paddingLeft: '1.5rem', fontSize: '0.8rem' }}>
                    {clearSandboxResult.errors.slice(0, 10).map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {clearSandboxResult.errors.length > 10 && (
                      <li>... and {clearSandboxResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
