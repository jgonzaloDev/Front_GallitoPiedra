import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)
  const [verPass, setVerPass]   = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Ingresa tu correo y contraseña'); return }
    setCargando(true)
    setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setCargando(false)
    if (err) {
      if (err.message.includes('Invalid login')) setError('Correo o contraseña incorrectos')
      else setError('Error al iniciar sesión. Intenta de nuevo.')
    } else {
      onLogin(data.user)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f5f0e8', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo / encabezado */}
        <div style={{ backgroundColor: '#2D4A2D', borderRadius: '16px 16px 0 0', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(212,196,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4C4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p style={{ color: '#D4C4A0', fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            Decoraciones Gallito y Piedra
          </p>
          <p style={{ color: '#a0b89a', fontSize: '12px' }}>Sistema de gestión</p>
        </div>

        {/* Formulario */}
        <div style={{ backgroundColor: '#fff', borderRadius: '0 0 16px 16px', padding: '2rem 1.5rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#2a2a2a', marginBottom: '6px' }}>Iniciar sesión</p>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Ingresa tus credenciales para acceder</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Correo electrónico</p>
              <input
                type="email" placeholder="tu@correo.com" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '9px', border: `1px solid ${error ? '#f9a0a0' : '#e0d8c8'}`, fontSize: '14px', outline: 'none', transition: 'border 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#2D4A2D'}
                onBlur={e => e.target.style.borderColor = error ? '#f9a0a0' : '#e0d8c8'}
              />
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Contraseña</p>
              <div style={{ position: 'relative' }}>
                <input
                  type={verPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  style={{ width: '100%', padding: '11px 44px 11px 14px', borderRadius: '9px', border: `1px solid ${error ? '#f9a0a0' : '#e0d8c8'}`, fontSize: '14px', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#2D4A2D'}
                  onBlur={e => e.target.style.borderColor = error ? '#f9a0a0' : '#e0d8c8'}
                />
                <button type="button" onClick={() => setVerPass(!verPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '12px' }}>
                  {verPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ backgroundColor: '#FCEBEB', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#A32D2D', fontSize: '18px' }}>⚠</span>
                <p style={{ color: '#A32D2D', fontSize: '13px', fontWeight: '500' }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={cargando}
              style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '9px', padding: '13px', fontSize: '15px', fontWeight: '600', cursor: cargando ? 'wait' : 'pointer', opacity: cargando ? 0.7 : 1, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {cargando ? (
                <>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(212,196,160,0.3)', borderTopColor: '#D4C4A0', animation: 'spin 0.8s linear infinite' }} />
                  Verificando...
                </>
              ) : 'Ingresar al sistema'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#f9f6f0', borderRadius: '8px', border: '1px solid #e0d8c8' }}>
            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>
              ¿No tienes acceso? Contacta al administrador.
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
