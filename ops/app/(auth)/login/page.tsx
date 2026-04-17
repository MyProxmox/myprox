'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { login } from '@/lib/auth'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      const from = searchParams.get('from') || '/'
      router.push(from)
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response
      ) {
        const data = (err.response as { data?: { message?: string } }).data
        setError(data?.message || 'Identifiants invalides')
      } else {
        setError('Impossible de contacter le serveur. Vérifiez votre connexion.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background decoration */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--accent)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'var(--accent-light)' }}
        />
      </div>

      {/* Login card */}
      <div
        className="relative w-full max-w-md glass p-8 space-y-8"
        style={{ borderRadius: 16 }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="https://cdn.myprox.app/img/logos/myprox-logo-purple.png"
            alt="MyProx"
            width={160}
            height={48}
            priority
            className="object-contain"
            unoptimized
          />
          <div className="text-center">
            <p
              className="text-sm font-medium tracking-widest uppercase"
              style={{ color: 'var(--accent-light)' }}
            >
              Ops Center
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Connectez-vous pour accéder à votre infrastructure
            </p>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)',
            }}
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@example.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)'
              }}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-lg text-sm transition-colors"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
                aria-label={
                  showPassword
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: loading
                ? 'rgba(124, 58, 237, 0.5)'
                : 'var(--accent)',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            {loading ? (
              <>
                <span
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
                Connexion en cours…
              </>
            ) : (
              <>
                <LogIn size={16} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p
          className="text-center text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          MyProx Ops Center · Accès réservé aux administrateurs
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ background: '#09090f', minHeight: '100vh' }} />}>
      <LoginForm />
    </Suspense>
  )
}
