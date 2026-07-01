import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login      from './pages/Login'
import Sidebar    from './components/Sidebar'
import Inicio     from './pages/Inicio'
import Catalogo   from './components/Catalogo'
import Clientes   from './pages/Clientes'
import Cotizaciones from './pages/Cotizaciones'
import Ventas     from './pages/Ventas'
import Contratos  from './pages/Contratos'
import Cortes     from './pages/Cortes'
import Retazos    from './pages/Retazos'
import Reportes   from './pages/Reportes'

export default function App() {
  const [usuario,     setUsuario]     = useState(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setVerificando(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  if (verificando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f0e8', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #D4C4A0', borderTopColor: '#2D4A2D', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#2D4A2D', fontWeight: '600', fontSize: '15px' }}>Cargando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!usuario) return <Login onLogin={setUsuario} />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar onLogout={handleLogout} usuario={usuario} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Routes>
            <Route path="/"             element={<Inicio />}       />
            <Route path="/catalogo"     element={<Catalogo />}     />
            <Route path="/clientes"     element={<Clientes />}     />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/ventas"       element={<Ventas />}       />
            <Route path="/contratos"    element={<Contratos />}    />
            <Route path="/cortes"       element={<Cortes />}       />
            <Route path="/retazos"      element={<Retazos />}      />
            <Route path="/reportes"     element={<Reportes />}     />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
