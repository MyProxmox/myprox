'use client'

import { RefreshCw } from 'lucide-react'
import { useOpsStore } from '@/lib/store'
import { useState } from 'react'

interface HeaderProps {
  title: string
  onRefresh?: () => void | Promise<void>
}

export default function Header({ title, onRefresh }: HeaderProps) {
  const apiOnline = useOpsStore((s) => s.apiOnline)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setTimeout(() => setRefreshing(false), 600)
    }
  }

  return (
    <header
      style={{
        height: 60,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Page title */}
      <h1
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h1>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* API status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: apiOnline ? 'var(--success)' : 'var(--error)',
              boxShadow: apiOnline
                ? '0 0 6px var(--success)'
                : '0 0 6px var(--error)',
              transition: 'all 0.3s',
            }}
          />
          <span>{apiOnline ? 'API connectée' : 'API hors ligne'}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Actualiser"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              color: refreshing ? 'var(--text-muted)' : 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
            <span>Actualiser</span>
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </header>
  )
}
