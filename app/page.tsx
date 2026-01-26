'use client'

import { useState } from 'react'

type DemoType = 'ai-token' | 'infra-saas' | 'hybrid-seat' | null

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [selectedDemoType, setSelectedDemoType] = useState<DemoType>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        color: '#1a1a1a',
      }}>
        Metronome Demo Generator
      </h1>
      <p style={{
        marginBottom: '3rem',
        color: '#666',
        textAlign: 'center',
        fontSize: '1.1rem',
      }}>
        Generate demos for your Metronome account
      </p>

      {/* API Key Input */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        marginBottom: '3rem',
        padding: '2rem',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#333',
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
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontFamily: 'inherit',
              marginBottom: '0.5rem',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Save API Key
          </button>
        </form>
        {apiKey && (
          <p style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: '#666',
            fontStyle: 'italic',
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
          color: '#333',
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
              backgroundColor: selectedDemoType === 'ai-token' ? '#e8f4f8' : '#fff',
              border: `3px solid ${selectedDemoType === 'ai-token' ? '#0066cc' : '#ddd'}`,
              borderRadius: '12px',
              cursor: apiKey.trim() && !loading ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: apiKey.trim() ? 1 : 0.6,
              boxShadow: selectedDemoType === 'ai-token' ? '0 4px 12px rgba(0,102,204,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#333',
            }}>
              🤖 AI Token Based
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#666',
              lineHeight: '1.5',
            }}>
              Generate a demo similar to OpenAI's token-based billing model. Perfect for AI/ML services that charge based on token usage.
            </div>
            {selectedDemoType === 'ai-token' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#0066cc',
                color: '#fff',
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
              backgroundColor: selectedDemoType === 'infra-saas' ? '#e8f4f8' : '#fff',
              border: `3px solid ${selectedDemoType === 'infra-saas' ? '#0066cc' : '#ddd'}`,
              borderRadius: '12px',
              cursor: apiKey.trim() && !loading ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: apiKey.trim() ? 1 : 0.6,
              boxShadow: selectedDemoType === 'infra-saas' ? '0 4px 12px rgba(0,102,204,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#333',
            }}>
              🏗️ Infra SaaS
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#666',
              lineHeight: '1.5',
            }}>
              Generate a demo similar to Confluent's infrastructure SaaS billing model. Perfect for infrastructure services with usage-based pricing.
            </div>
            {selectedDemoType === 'infra-saas' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#0066cc',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '0.85rem',
                textAlign: 'center',
                fontWeight: '600',
              }}>
                Selected
              </div>
            )}
          </button>

          {/* Hybrid Seat+ Usage Demo */}
          <button
            onClick={() => handleDemoTypeSelect('hybrid-seat')}
            disabled={!apiKey.trim() || loading}
            style={{
              padding: '2rem',
              backgroundColor: selectedDemoType === 'hybrid-seat' ? '#e8f4f8' : '#fff',
              border: `3px solid ${selectedDemoType === 'hybrid-seat' ? '#0066cc' : '#ddd'}`,
              borderRadius: '12px',
              cursor: apiKey.trim() && !loading ? 'pointer' : 'not-allowed',
              textAlign: 'left',
              transition: 'all 0.2s',
              opacity: apiKey.trim() ? 1 : 0.6,
              boxShadow: selectedDemoType === 'hybrid-seat' ? '0 4px 12px rgba(0,102,204,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
              fontWeight: '600',
              color: '#333',
            }}>
              👥 Hybrid Seat+ Usage
            </div>
            <div style={{
              fontSize: '0.95rem',
              color: '#666',
              lineHeight: '1.5',
            }}>
              Generate a demo similar to Notion's hybrid billing model. Combines seat-based pricing with usage-based charges for a comprehensive billing solution.
            </div>
            {selectedDemoType === 'hybrid-seat' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.5rem',
                backgroundColor: '#0066cc',
                color: '#fff',
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
          backgroundColor: '#fee',
          color: '#c00',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '600px',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Next Steps (when demo type is selected) */}
      {selectedDemoType && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: '#e8f4f8',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
        }}>
          <h3 style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: '#333',
          }}>
            Next Steps
          </h3>
          <p style={{
            color: '#666',
            lineHeight: '1.6',
          }}>
            {selectedDemoType === 'ai-token'
              ? 'AI Token Based demo configuration will be available here. You can set up customers, products, and usage events for token-based billing.'
              : selectedDemoType === 'infra-saas'
              ? 'Infra SaaS demo configuration will be available here. You can set up customers, products, and usage events for infrastructure-based billing.'
              : 'Hybrid Seat+ Usage demo configuration will be available here. You can set up customers, products, and usage events combining seat-based and usage-based billing.'}
          </p>
        </div>
      )}
    </main>
  )
}
