import {
  FileText, Scissors, BookOpen,
  Grid, AlertTriangle, XCircle,
  UserPlus, ShoppingCart, Package
} from 'lucide-react'

const hoy = new Date().toLocaleDateString('es-PE', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

const metricas = [
  { label: 'Cotizaciones abiertas', valor: 0, sub: 'Sin confirmar',    color: '#185FA5', bg: '#E6F1FB' },
  { label: 'Órdenes de corte',      valor: 0, sub: 'Pendientes hoy',   color: '#854F0B', bg: '#FAEEDA' },
  { label: 'Productos en catálogo', valor: 6, sub: 'Tipos de piedra',  color: '#2D4A2D', bg: '#EAF3DE' },
  { label: 'Retazos disponibles',   valor: 0, sub: 'En el patio',      color: '#2a2a2a', bg: '#f5f0e8' },
]

const accesos = [
  { label: 'Nueva cotización', desc: 'Crear para un cliente',   icon: FileText,     bg: '#EAF3DE', color: '#3B6D11', to: '/cotizaciones' },
  { label: 'Nuevo cliente',    desc: 'Registrar en el sistema', icon: UserPlus,     bg: '#E6F1FB', color: '#185FA5', to: '/clientes' },
  { label: 'Orden de corte',   desc: 'Asignar a cortador',      icon: ScissorsIcon, bg: '#FAEEDA', color: '#854F0B', to: '/cortes' },
]

const alertasStock = [
  { nombre: 'Laja Talomoye',    estado: 'bajo' },
  { nombre: 'Laja Arequipeña',  estado: 'bajo' },
  { nombre: 'Rococho Arequipeño', estado: 'sin_stock' },
]

export default function Inicio() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Bienvenido al sistema</p>
        <p style={{ color: '#a0b89a', fontSize: '12px', textTransform: 'capitalize' }}>{hoy}</p>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Banner de bienvenida */}
        <div style={{
          backgroundColor: '#2D4A2D',
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h2 style={{ color: '#D4C4A0', fontSize: '18px', fontWeight: '600' }}>
              Buenos días, Administrador
            </h2>
            <p style={{ color: '#a0b89a', fontSize: '13px', marginTop: '6px' }}>
              Aquí tienes el resumen del día en Decoraciones Gallito y Piedra
            </p>
          </div>
          <div style={{
            backgroundColor: 'rgba(212,196,160,0.15)',
            border: '1px solid rgba(212,196,160,0.3)',
            borderRadius: '10px',
            padding: '12px 20px',
            textAlign: 'center',
          }}>
            <p style={{ color: '#D4C4A0', fontSize: '22px', fontWeight: '700' }}>S/ 0.00</p>
            <p style={{ color: '#a0b89a', fontSize: '11px', marginTop: '4px' }}>Ventas del día</p>
          </div>
        </div>

        {/* Métricas */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '10px' }}>Resumen general</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {metricas.map((m, i) => (
              <div key={i} style={{
                backgroundColor: '#fff',
                borderRadius: '10px',
                border: '1px solid #e0d8c8',
                padding: '14px',
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  backgroundColor: m.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: '10px',
                }}>
                  <BookOpen size={16} color={m.color} />
                </div>
                <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{m.label}</p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: m.color }}>{m.valor}</p>
                <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Acceso rápido */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '10px' }}>Acceso rápido</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {accesos.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} style={{
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  border: '1px solid #e0d8c8',
                  padding: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'transform 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '8px',
                    backgroundColor: a.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={18} color={a.color} />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a' }}>{a.label}</p>
                    <p style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{a.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Alertas de stock */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '10px' }}>Alertas de stock</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>

            {/* Stock bajo */}
            <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={15} color="#854F0B" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a' }}>Stock bajo</span>
                <span style={{ fontSize: '10px', backgroundColor: '#FAEEDA', color: '#854F0B', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>
                  {alertasStock.filter(a => a.estado === 'bajo').length} productos
                </span>
              </div>
              {alertasStock.filter(a => a.estado === 'bajo').map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0e8', fontSize: '12px', color: '#555' }}>
                  <span>{a.nombre}</span>
                  <span style={{ color: '#854F0B', fontWeight: '500' }}>Bajo</span>
                </div>
              ))}
            </div>

            {/* Sin stock */}
            <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <XCircle size={15} color="#A32D2D" />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a' }}>Sin stock</span>
                <span style={{ fontSize: '10px', backgroundColor: '#FCEBEB', color: '#A32D2D', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>
                  {alertasStock.filter(a => a.estado === 'sin_stock').length} producto
                </span>
              </div>
              {alertasStock.filter(a => a.estado === 'sin_stock').map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0e8', fontSize: '12px', color: '#555' }}>
                  <span>{a.nombre}</span>
                  <span style={{ color: '#A32D2D', fontWeight: '500' }}>Agotado</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}