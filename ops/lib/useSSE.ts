'use client'

import { useEffect, useRef } from 'react'

function safeGetToken(): string | null {
  try {
    if (typeof window === 'undefined') return null
    const ls = window.localStorage
    if (typeof ls?.getItem !== 'function') return null
    return ls.getItem('ops_access_token')
  } catch {
    return null
  }
}

export interface SSENodeMetric {
  cpu: number
  mem: number
  memTotal: number
  netin: number
  netout: number
  timestamp: number
  error?: string
}

export function useNodeSSE(
  serverId: string | null,
  onMetric: (metric: SSENodeMetric) => void,
  enabled = true
) {
  const onMetricRef = useRef(onMetric)
  onMetricRef.current = onMetric

  useEffect(() => {
    if (!serverId || !enabled) return
    const token = safeGetToken()
    if (!token) return

    const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
    const url = `${apiBase}/api/v1/servers/${serverId}/node/stream?token=${encodeURIComponent(token)}`

    const es = new EventSource(url)

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as SSENodeMetric
        onMetricRef.current(data)
      } catch {
        // ignore
      }
    }

    return () => {
      es.close()
    }
  }, [serverId, enabled])
}
