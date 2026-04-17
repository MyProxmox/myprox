import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'var(--accent)',
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            height: 14,
            width: 80,
            background: 'var(--surface-2)',
            borderRadius: 4,
            marginBottom: 12,
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <div
          style={{
            height: 28,
            width: 60,
            background: 'var(--surface-2)',
            borderRadius: 6,
            marginBottom: 8,
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <div
          style={{
            height: 12,
            width: 100,
            background: 'var(--surface-2)',
            borderRadius: 4,
            animation: 'shimmer 1.5s infinite',
          }}
        />
        <style jsx global>{`
          @keyframes shimmer {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        transition: 'border-color 0.15s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icon background glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: iconColor,
          opacity: 0.06,
          filter: 'blur(20px)',
        }}
      />

      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: `${iconColor}1a`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
          }}
        >
          <Icon size={18} />
        </div>
      </div>

      {/* Value */}
      <span
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </span>

      {/* Subtitle */}
      {subtitle && (
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {subtitle}
        </span>
      )}
    </div>
  )
}
