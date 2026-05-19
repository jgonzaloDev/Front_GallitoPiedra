import { createContext, useContext, useState } from 'react'

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

  return (
    <AppContext.Provider value={{
      productos,    setProductos,
      clientes,     setClientes,
      cotizaciones, setCotizaciones,
      ventas,       setVentas,
      ordenes,      setOrdenes,
      retazos,      setRetazos,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
