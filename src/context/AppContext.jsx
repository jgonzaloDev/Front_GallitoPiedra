import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AppContext = createContext()

const productosIniciales = [
  { id: 1, nombre: 'Laja Granítica Ayacuchana', modelos: 'Modelo 10x10, 20x10, 20 variable, fachaleta rústica', tipo: 'grantica',   unidad: 'm²', stock: 'ok',        foto: '/productos/granitica.png',  color: '#b8a898' },
  { id: 2, nombre: 'Laja Pizarra Negra',         modelos: 'Fachaleta negra, modelo 10 variable',                 tipo: 'pizarra',    unidad: 'm²', stock: 'ok',        foto: '/productos/pizarra.png',    color: '#4a4a4a' },
  { id: 3, nombre: 'Laja Talomoye',              modelos: 'Modelo 5 variable, 10x10, retazo irregular',          tipo: 'talomoye',   unidad: 'm²', stock: 'bajo',      foto: '/productos/talamoye.png',   color: '#7a6a58' },
  { id: 4, nombre: 'Laja Yura Blanca',           modelos: 'Fachaleta blanca rústica, modelo rústico',            tipo: 'yura',       unidad: 'm²', stock: 'ok',        foto: '/productos/yura.png',       color: '#d4c8b0' },
  { id: 5, nombre: 'Laja Arequipeña',            modelos: 'Cuadrada bordes naturales, color beige',              tipo: 'arequipena', unidad: 'm²', stock: 'bajo',      foto: '/productos/arequipena.png', color: '#c4927a' },
  { id: 6, nombre: 'Rococho Arequipeño',         modelos: 'Cara lisa y rústico quemado, espesor 1.5cm',          tipo: 'rococho',    unidad: 'm²', stock: 'sin_stock', foto: '/productos/rococho.png',    color: '#a0522d' },
]

export function AppProvider({ children }) {
  const [productos,     setProductos]     = useState(productosIniciales)
  const [clientes,      setClientes]      = useState([])
  const [cotizaciones,  setCotizaciones]  = useState([])
  const [ventas,        setVentas]        = useState([])
  const [ordenes,       setOrdenes]       = useState([])
  const [retazos,       setRetazos]       = useState([])
  const [cargando,      setCargando]      = useState(true)

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    setCargando(true)
    try {
      const [
        { data: dataClientes },
        { data: dataCotizaciones },
        { data: dataVentas },
        { data: dataOrdenes },
        { data: dataRetazos },
      ] = await Promise.all([
        supabase.from('clientes').select('*').order('created_at', { ascending: false }),
        supabase.from('cotizaciones').select('*').order('created_at', { ascending: false }),
        supabase.from('ventas').select('*').order('created_at', { ascending: false }),
        supabase.from('ordenes').select('*').order('created_at', { ascending: false }),
        supabase.from('retazos').select('*').order('created_at', { ascending: false }),
      ])
      if (dataClientes)     setClientes(dataClientes)
      if (dataCotizaciones) setCotizaciones(dataCotizaciones)
      if (dataVentas)       setVentas(dataVentas)
      if (dataOrdenes)      setOrdenes(dataOrdenes)
      if (dataRetazos)      setRetazos(dataRetazos)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setCargando(false)
    }
  }

  // ── PRODUCTOS (solo estado local) ─────────────────────────────────────────
  function actualizarProducto(id, cambios) {
    setProductos(prev => prev.map(p => p.id === id ? { ...p, ...cambios } : p))
  }

  // ── CLIENTES ──────────────────────────────────────────────────────────────
  async function agregarCliente(cliente) {
    const { data, error } = await supabase.from('clientes').insert([cliente]).select().single()
    if (error) { console.error(error); return null }
    setClientes(prev => [data, ...prev])
    return data
  }
  async function actualizarCliente(id, cambios) {
    const { data, error } = await supabase.from('clientes').update(cambios).eq('id', id).select().single()
    if (error) { console.error(error); return null }
    setClientes(prev => prev.map(c => c.id === id ? data : c))
    return data
  }
  async function eliminarCliente(id) {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    if (error) { console.error(error); return false }
    setClientes(prev => prev.filter(c => c.id !== id))
    return true
  }

  // ── COTIZACIONES ──────────────────────────────────────────────────────────
  async function agregarCotizacion(cot) {
    const { data, error } = await supabase.from('cotizaciones').insert([cot]).select().single()
    if (error) { console.error(error); return null }
    setCotizaciones(prev => [data, ...prev])
    return data
  }
  async function actualizarCotizacion(id, cambios) {
    const { data, error } = await supabase.from('cotizaciones').update(cambios).eq('id', id).select().single()
    if (error) { console.error(error); return null }
    setCotizaciones(prev => prev.map(c => c.id === id ? data : c))
    return data
  }
  async function eliminarCotizacion(id) {
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id)
    if (error) { console.error(error); return false }
    setCotizaciones(prev => prev.filter(c => c.id !== id))
    return true
  }

  // ── VENTAS ────────────────────────────────────────────────────────────────
  async function agregarVenta(venta) {
    const { data, error } = await supabase.from('ventas').insert([venta]).select().single()
    if (error) { console.error(error); return null }
    setVentas(prev => [data, ...prev])
    return data
  }
  async function actualizarVenta(id, cambios) {
    const { data, error } = await supabase.from('ventas').update(cambios).eq('id', id).select().single()
    if (error) { console.error(error); return null }
    setVentas(prev => prev.map(v => v.id === id ? data : v))
    return data
  }
  async function eliminarVenta(id) {
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) { console.error(error); return false }
    setVentas(prev => prev.filter(v => v.id !== id))
    return true
  }

  // ── ORDENES ───────────────────────────────────────────────────────────────
  async function agregarOrden(orden) {
    const { data, error } = await supabase.from('ordenes').insert([orden]).select().single()
    if (error) { console.error(error); return null }
    setOrdenes(prev => [data, ...prev])
    return data
  }
  async function actualizarOrden(id, cambios) {
    const { data, error } = await supabase.from('ordenes').update(cambios).eq('id', id).select().single()
    if (error) { console.error(error); return null }
    setOrdenes(prev => prev.map(o => o.id === id ? data : o))
    return data
  }
  async function eliminarOrden(id) {
    const { error } = await supabase.from('ordenes').delete().eq('id', id)
    if (error) { console.error(error); return false }
    setOrdenes(prev => prev.filter(o => o.id !== id))
    return true
  }

  // ── RETAZOS ───────────────────────────────────────────────────────────────
  async function agregarRetazo(retazo) {
    const { data, error } = await supabase.from('retazos').insert([retazo]).select().single()
    if (error) { console.error(error); return null }
    setRetazos(prev => [data, ...prev])
    return data
  }
  async function actualizarRetazo(id, cambios) {
    const { data, error } = await supabase.from('retazos').update(cambios).eq('id', id).select().single()
    if (error) { console.error(error); return null }
    setRetazos(prev => prev.map(r => r.id === id ? data : r))
    return data
  }
  async function eliminarRetazo(id) {
    const { error } = await supabase.from('retazos').delete().eq('id', id)
    if (error) { console.error(error); return false }
    setRetazos(prev => prev.filter(r => r.id !== id))
    return true
  }

  return (
    <AppContext.Provider value={{
      productos,    setProductos,    actualizarProducto,
      clientes,     setClientes,
      cotizaciones, setCotizaciones,
      ventas,       setVentas,
      ordenes,      setOrdenes,
      retazos,      setRetazos,
      cargando,
      agregarCliente,     actualizarCliente,     eliminarCliente,
      agregarCotizacion,  actualizarCotizacion,  eliminarCotizacion,
      agregarVenta,       actualizarVenta,       eliminarVenta,
      agregarOrden,       actualizarOrden,       eliminarOrden,
      agregarRetazo,      actualizarRetazo,      eliminarRetazo,
      cargarTodo,
    }}>
      {cargando ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f0e8', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #D4C4A0', borderTopColor: '#2D4A2D', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#2D4A2D', fontWeight: '600', fontSize: '15px' }}>Cargando Decoraciones Gallito y Piedra...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
