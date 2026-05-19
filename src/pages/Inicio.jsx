import {
  FileText, Scissors, Package,
  Grid, AlertTriangle, XCircle,
  UserPlus
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

const hoy = new Date().toLocaleDateString('es-PE', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

export default function Inicio() {
  const { ventas, cotizaciones, productos, retazos, ordenes } = useApp()
  const navigate = useNavigate()

  const ventasHoy      = ventas.filter(v => v.fecha === new Date().toISOString().split('T')[0])
  const totalHoy       = ventasHoy.reduce((s, v) => s + (v.total || 0), 0).toFixed(2)
  const cotAbiertas    = cotizaciones.filter(c => c.estado === 'borrador' || c.estado === 'enviada').length
  const ordenesPend    = ordenes.filter(o => o.estado === 'asignada' || o.estado === 'en_proceso').length
  const retazosDisp    = retazos.filter(r => r.estado === 'disponible').length
  const stockBajo      = productos.filter(p => p.stock === 'bajo')
  const sinStock       = productos.filter(p => p.stock === 'sin_stock')

  const metricas = [
    { label: 'Cotizaciones abiertas', valor: cotAbiertas,   sub: 'Sin confirmar',  color: '#185FA5', bg: '#E6F1FB', icono: FileText  },
    { label: 'Órdenes de corte',      valor: ordenesPend,   sub: 'Pendientes hoy', color: '#854F0B', bg: '#FAEEDA', icono: Scissors  },
    { label: 'Productos en catálogo', valor: productos.length, sub: 'Tipos de piedra', color: '#2D4A2D', bg: '#EAF3DE', icono: Package },
    { label: 'Retazos disponibles',   valor: retazosDisp,   sub: 'En el patio',    color: '#2a2a2a', bg: '#f5f0e8', icono: Grid      },
  ]

  const accesos = [
    { label: 'Nueva cotización', desc: 'Crear para un cliente',   icon: FileText, bg: '#EAF3DE', color: '#3B6D11', to: '/cotizaciones' },
    { label: 'Nuevo cliente',    desc: 'Registrar en el sistema', icon: UserPlus, bg: '#E6F1FB', color: '#185FA5', to: '/clientes'     },
    { label: 'Orden de corte',   desc: 'Asignar a cortador',      icon: Scissors, bg: '#FAEEDA', color: '#854F0B', to: '/cortes'       },
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8' }}>

      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Bienvenido al sistema</p>
        <p style={{ color: '#a0b89a', fontSize: '12px', textTransform: 'capitalize' }}>{hoy}</p>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Banner */}
        <div style={{ backgroundColor: '#2D4A2D', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ color: '#D4C4A0', fontSize: '18px', fontWeight: '600' }}>Buenos días, Administrador</h2>
            <p style={{ color: '#a0b89a', fontSize: '13px', marginTop: '6px' }}>Aquí tienes el resumen del día en Decoraciones Gallito y Piedra</p>
          </div>
          <div style={{ backgroundColor: 'rgba(212,196,160,0.15)', border: '1px solid rgba(212,196,160,0.3)', borderRadius: '10px', padding: '12px 20px', textAlign: 'center' }}>
            <p style={{ color: '#D4C4A0', fontSize: '22px', fontWeight: '700' }}>S/ {totalHoy}</p>
            <p style={{ color: '#a0b89a', fontSize: '11px', marginTop: '4px' }}>Ventas del día</p>
          </div>
        </div>

        {/* Métricas */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '10px' }}>Resumen general</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            {metricas.map((m, i) => {
              const Icono = m.icono
              return (
                <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                    <Icono size={16} color={m.color} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{m.label}</p>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: m.color }}>{m.valor}</p>
                  <p style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{m.sub}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Acceso rápido */}
        <div>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '10px' }}>Acceso rápido</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {accesos.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} onClick={() => navigate(a.to)} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'transform 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
        {(stockBajo.length > 0 || sinStock.length > 0) && (
          <div>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '10px' }}>Alertas de stock</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              {stockBajo.length > 0 && (
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <AlertTriangle size={15} color="#854F0B" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a' }}>Stock bajo</span>
                    <span style={{ fontSize: '10px', backgroundColor: '#FAEEDA', color: '#854F0B', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>{stockBajo.length} productos</span>
                  </div>
                  {stockBajo.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0e8', fontSize: '12px', color: '#555' }}>
                      <span>{p.nombre}</span>
                      <span style={{ color: '#854F0B', fontWeight: '500' }}>Bajo</span>
                    </div>
                  ))}
                </div>
              )}
              {sinStock.length > 0 && (
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <XCircle size={15} color="#A32D2D" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a' }}>Sin stock</span>
                    <span style={{ fontSize: '10px', backgroundColor: '#FCEBEB', color: '#A32D2D', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>{sinStock.length} producto{sinStock.length !== 1 ? 's' : ''}</span>
                  </div>
                  {sinStock.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0e8', fontSize: '12px', color: '#555' }}>
                      <span>{p.nombre}</span>
                      <span style={{ color: '#A32D2D', fontWeight: '500' }}>Agotado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
