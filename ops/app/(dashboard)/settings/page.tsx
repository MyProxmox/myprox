'use client'

import { Settings, User, Bell, Shield, Palette } from 'lucide-react'
import Header from '@/components/Header'
import { getUser } from '@/lib/auth'

function SettingsSection({
  icon: Icon,
  title,
  description,
  comingSoon = false,
}: {
  icon: React.ElementType
  title: string
  description: string
  comingSoon?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: 'rgba(124, 58, 237, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-light)',
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {title}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {description}
        </p>
      </div>
      {comingSoon && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 20,
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          Bientôt
        </span>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const user = getUser()

  return (
    <>
      <Header title="Paramètres" />

      <div style={{ padding: 24, maxWidth: 720 }}>
        {/* Profile card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '24px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
              {user?.name || user?.email || 'Utilisateur'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {user?.email}
            </p>
            {user?.role && (
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(124, 58, 237, 0.12)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  color: 'var(--accent-light)',
                  textTransform: 'capitalize',
                }}
              >
                {user.role}
              </span>
            )}
          </div>
        </div>

        {/* Settings sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SettingsSection
            icon={User}
            title="Profil & Compte"
            description="Modifier votre email, mot de passe et informations personnelles"
            comingSoon
          />
          <SettingsSection
            icon={Bell}
            title="Notifications"
            description="Configurer les alertes email et push pour les événements critiques"
            comingSoon
          />
          <SettingsSection
            icon={Shield}
            title="Sécurité"
            description="Authentification à deux facteurs, sessions actives, tokens API"
            comingSoon
          />
          <SettingsSection
            icon={Palette}
            title="Apparence"
            description="Thème, densité d'affichage et préférences visuelles"
            comingSoon
          />
          <SettingsSection
            icon={Settings}
            title="API & Intégrations"
            description="Gérer les clés API, webhooks et intégrations tierces"
            comingSoon
          />
        </div>

        {/* Version info */}
        <p
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: 32,
          }}
        >
          MyProx Ops Center v0.1.0 · Construit avec Next.js 15
        </p>
      </div>
    </>
  )
}
