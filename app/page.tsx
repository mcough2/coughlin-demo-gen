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
          {/* AI Token Based Demo */}
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
              🤖 AI Token Based
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#1C1C1C',
              lineHeight: '1.5',
              opacity: 0.7,
            }}>
              Generate a demo with token-based billing model. Perfect for AI/ML services that charge based on token usage.
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
              lineHeight: '1.5',
              opacity: 0.7,
            }}>
              Generate a demo with hybrid billing model. Combines seat-based pricing with usage-based charges for a comprehensive billing solution.
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
            {selectedDemoType === 'infra-saas' ? 'Generate Infra SaaS Demo' : 'Next Steps'}
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
                        {generationResult.results.packages && Object.keys(generationResult.results.packages).length > 0 && (
                          <div>• Created {Object.keys(generationResult.results.packages).length} package{Object.keys(generationResult.results.packages).length !== 1 ? 's' : ''}</div>
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
          ) : (
            <p style={{
              color: '#1C1C1C',
              lineHeight: '1.6',
              opacity: 0.8,
            }}>
              {selectedDemoType === 'ai-token'
                ? 'AI Token Based demo configuration will be available here. You can set up customers, products, and usage events for token-based billing.'
                : 'Hybrid Seat+ Usage demo configuration will be available here. You can set up customers, products, and usage events combining seat-based and usage-based billing.'}
            </p>
          )}
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
            This will archive all customers, rate cards, products, and billable metrics in your account. This action cannot be undone.
          </p>
          <button
            onClick={async () => {
              if (!confirm('Are you sure you want to clear the sandbox? This will archive all customers, rate cards, products, and billable metrics. This action cannot be undone.')) {
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
                    • Rate Cards: {clearSandboxResult.summary.rateCardsArchived}
                  </div>
                  <div>
                    • Products: {clearSandboxResult.summary.productsArchived}
                  </div>
                  <div>
                    • Billable Metrics: {clearSandboxResult.summary.billableMetricsArchived}
                  </div>
                  {/* Packages archiving disabled - packages can't be archived via API */}
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
