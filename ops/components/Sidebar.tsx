'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Monitor,
  Server,
  Archive,
  Settings,
  LogOut,
} from 'lucide-react'
import { logout, getUser } from '@/lib/auth'

const NAV_ITEMS = [
  {
    label: 'Tableau de bord',
    href: '/',
    icon: LayoutDashboard,
    disabled: false,
  },
  {
    label: 'VMs & LXC',
    href: '/vms',
    icon: Monitor,
    disabled: false,
  },
  {
    label: 'Nœuds',
    href: '/nodes',
    icon: Server,
    disabled: false,
  },
  {
    label: 'Backups',
    href: '/backups',
    icon: Archive,
    disabled: true,
  },
]

const BOTTOM_ITEMS = [
  {
    label: 'Paramètres',
    href: '/settings',
    icon: Settings,
    disabled: false,
  },
]

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  disabled,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
  disabled: boolean
}) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    color: active ? 'var(--accent-light)' : 'var(--text-muted)',
    background: active ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
    textDecoration: 'none',
    userSelect: 'none',
  }

  if (disabled) {
    return (
      <div style={baseStyle}>
        <Icon size={17} />
        <span>{label}</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            background: 'var(--surface-2)',
            color: 'var(--text-muted)',
            padding: '1px 6px',
            borderRadius: 4,
            border: '1px solid var(--border)',
          }}
        >
          soon
        </span>
      </div>
    )
  }

  return (
    <Link href={href} style={baseStyle} className="sidebar-link">
      <Icon size={17} />
      <span>{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const user = getUser()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function handleLogout() {
    logout()
  }

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Link href="/" style={{ display: 'block' }}>
          <Image
            src="https://cdn.myprox.app/img/logos/myprox-logo-purple.png"
            alt="MyProx"
            width={120}
            height={36}
            className="object-contain"
            unoptimized
          />
        </Link>
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent-light)',
            marginTop: 6,
            paddingLeft: 2,
          }}
        >
          Ops Center
        </p>
      </div>

      {/* Main navigation */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
              disabled={item.disabled}
            />
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 10px 0',
        }}
      >
        {BOTTOM_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
            disabled={item.disabled}
          />
        ))}
      </div>

      {/* User + logout */}
      <div
        style={{
          padding: '12px 12px 16px',
          borderTop: '1px solid var(--border)',
          marginTop: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>

        {/* Email */}
        <span
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
          title={user?.email}
        >
          {user?.email || 'Utilisateur'}
        </span>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Se déconnecter"
          style={{
            background: 'none',
            border: 'none',
            padding: 6,
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--error)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>

      <style jsx global>{`
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.04) !important;
          color: var(--text) !important;
        }
      `}</style>
    </aside>
  )
}
