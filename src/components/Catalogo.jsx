import { useState } from 'react'
import { Search, Plus, Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react'

const productos = [
  {
    id: 1,
    nombre: 'Laja Granítica Ayacuchana',
    modelos: 'Modelo 10x10, 20x10, 20 variable, fachaleta rústica',
    unidad: 'm²',
    tipo: 'grantica',
    tag: 'Fachadas y pisos',
    stock: 'ok',
    precio_base: null,
    color: '#b8a898',
    foto: '/productos/granitica.png',
  },
  {
    id: 2,
    nombre: 'Laja Pizarra Negra',
    modelos: 'Fachaleta negra, modelo 10 variable',
    unidad: 'm²',
    tipo: 'pizarra',
    tag: 'Fachadas',
    stock: 'ok',
    precio_base: null,
    color: '#4a4a4a',
    foto: '/productos/pizarra.png',
  },
  {
    id: 3,
    nombre: 'Laja Talomoye',
    modelos: 'Modelo 5 variable, 10x10, retazo irregular',
    unidad: 'm²',
    tipo: 'talomoye',
    tag: 'Fachadas y columnas',
    stock: 'bajo',
    precio_base: null,
    color: '#7a6a58',
    foto: '/productos/talomoye.png',
  },
  {
    id: 4,
    nombre: 'Laja Yura Blanca',
    modelos: 'Fachaleta blanca rústica, modelo rústico',
    unidad: 'm²',
    tipo: 'yura',
    tag: 'Paredes elegantes',
    stock: 'ok',
    precio_base: null,
    color: '#d4c8b0',
    foto: '/productos/yura.png',
  },
  {
    id: 5,
    nombre: 'Laja Arequipeña',
    modelos: 'Cuadrada bordes naturales, color beige',
    unidad: 'm²',
    tipo: 'arequipena',
    tag: 'Acabado rústico',
    stock: 'bajo',
    precio_base: null,
    color: '#c4927a',
    foto: '/productos/arequipena.png',
  },
  {
    id: 6,
    nombre: 'Rococho Arequipeño',
    modelos: 'Cara lisa y rústico quemado, espesor 1.5cm',
    unidad: 'm²',
    tipo: 'rococho',
    tag: 'Enchape fachadas',
    stock: 'sin_stock',
    precio_base: null,
    color: '#a0522d',
    foto: '/productos/rococho.png',
  },
]

const stockConfig = {
  ok:        { label: 'Stock OK',   icon: CheckCircle,   color: '#3B6D11', bg: '#EAF3DE' },
  bajo:      { label: 'Stock bajo', icon: AlertTriangle, color: '#854F0B', bg: '#FAEEDA' },
  sin_stock: { label: 'Sin stock',  icon: XCircle,       color: '#A32D2D', bg: '#FCEBEB' },
}

const filtros = [
  { key: 'todos',      label: 'Todos' },
  { key: 'grantica',   label: 'Granítica' },
  { key: 'pizarra',    label: 'Pizarra' },
  { key: 'talomoye',   label: 'Talomoye' },
  { key: 'yura',       label: 'Yura Blanca' },
  { key: 'arequipena', label: 'Arequipeña' },
  { key: 'rococho',    label: 'Rococho' },
]

export default function Catalogo() {
  const [busqueda, setBusqueda] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('todos')
  const [seleccionado, setSeleccionado] = useState(null)

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.modelos.toLowerCase().includes(busqueda.toLowerCase())
    const coincideFiltro = filtroActivo === 'todos' || p.tipo === filtroActivo
    return coincideBusqueda && coincideFiltro
  })

  const conteo = {
    ok:        productos.filter(p => p.stock === 'ok').length,
    bajo:      productos.filter(p => p.stock === 'bajo').length,
    sin_stock: productos.filter(p => p.stock === 'sin_stock').length,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--beige-claro)', flex: 1, width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: 'var(--verde)', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'var(--beige)', fontSize: '20px', fontWeight: '600', letterSpacing: '0.5px' }}>
            Decoraciones Gallito y Piedra
          </h1>
          <p style={{ color: '#a0b89a', fontSize: '13px', marginTop: '2px' }}>Catálogo de productos</p>
        </div>
        <button style={{
          backgroundColor: 'var(--beige)',
          color: 'var(--verde)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      <div style={{ padding: '1.5rem' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
          <Metrica label="Total productos" valor={productos.length} icono={<Package size={18} color="var(--verde)" />} />
          <Metrica label="Stock normal"    valor={conteo.ok}        color="#3B6D11" />
          <Metrica label="Stock bajo"      valor={conteo.bajo}      color="#854F0B" />
          <Metrica label="Sin stock"       valor={conteo.sin_stock} color="#A32D2D" />
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o modelo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '8px',
              border: '1px solid var(--borde)',
              backgroundColor: 'var(--blanco)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {filtros.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltroActivo(f.key)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: 'pointer',
                border: filtroActivo === f.key ? '1.5px solid var(--verde)' : '1px solid var(--borde)',
                backgroundColor: filtroActivo === f.key ? 'var(--verde)' : 'var(--blanco)',
                color: filtroActivo === f.key ? 'var(--beige)' : 'var(--texto-secundario)',
                fontWeight: filtroActivo === f.key ? '600' : '400',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid de productos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {productosFiltrados.map(p => (
            <TarjetaProducto
              key={p.id}
              producto={p}
              onClick={() => setSeleccionado(p)}
            />
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--texto-secundario)' }}>
            <Package size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
            <p>No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {seleccionado && (
        <Modal producto={seleccionado} onClose={() => setSeleccionado(null)} />
      )}
    </div>
  )
}

function Metrica({ label, valor, color, icono }) {
  return (
    <div style={{
      backgroundColor: 'var(--blanco)',
      borderRadius: '10px',
      border: '1px solid var(--borde)',
      padding: '14px',
    }}>
      <p style={{ fontSize: '12px', color: 'var(--texto-secundario)', marginBottom: '6px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icono}
        <span style={{ fontSize: '22px', fontWeight: '600', color: color || 'var(--texto)' }}>{valor}</span>
      </div>
    </div>
  )
}

function TarjetaProducto({ producto, onClick }) {
  const s = stockConfig[producto.stock]
  const IconoStock = s.icon

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--blanco)',
        borderRadius: '12px',
        border: '1px solid var(--borde)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Imagen real con fallback al color */}
      <div style={{
        height: '130px',
        backgroundColor: producto.color,
        overflow: 'hidden',
      }}>
        <img
          src={producto.foto}
          alt={producto.nombre}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      <div style={{ padding: '12px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--texto)' }}>
          {producto.nombre}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--texto-secundario)', marginBottom: '10px', lineHeight: '1.4' }}>
          {producto.modelos}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '11px',
            backgroundColor: '#f0ebe0',
            color: 'var(--verde)',
            padding: '3px 8px',
            borderRadius: '20px',
            fontWeight: '500'
          }}>
            por {producto.unidad}
          </span>
          <span style={{
            fontSize: '11px',
            backgroundColor: s.bg,
            color: s.color,
            padding: '3px 8px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '500'
          }}>
            <IconoStock size={11} />
            {s.label}
          </span>
        </div>
      </div>
    </div>
  )
}

function Modal({ producto, onClose }) {
  const s = stockConfig[producto.stock]
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '1rem'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--blanco)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          overflow: 'hidden',
        }}
      >
        {/* Imagen modal con fallback */}
        <div style={{ height: '200px', backgroundColor: producto.color, overflow: 'hidden' }}>
          <img
            src={producto.foto}
            alt={producto.nombre}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={e => { e.target.style.display = 'none' }}
          />
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--verde)', flex: 1 }}>{producto.nombre}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#888', marginLeft: '8px' }}>✕</button>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--texto-secundario)', marginBottom: '16px', lineHeight: '1.6' }}>
            <strong>Modelos disponibles:</strong> {producto.modelos}
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', backgroundColor: '#f0ebe0', color: 'var(--verde)', padding: '4px 12px', borderRadius: '20px' }}>
              Venta por {producto.unidad}
            </span>
            <span style={{ fontSize: '12px', backgroundColor: s.bg, color: s.color, padding: '4px 12px', borderRadius: '20px' }}>
              {s.label}
            </span>
          </div>

          <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--texto-secundario)', marginBottom: '4px' }}>Precio por {producto.unidad}</p>
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--texto)' }}>Se define al cotizar</p>
          </div>

          <button style={{
            width: '100%',
            backgroundColor: 'var(--verde)',
            color: 'var(--beige)',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}>
            + Agregar a cotización
          </button>
        </div>
      </div>
    </div>
  )
}
