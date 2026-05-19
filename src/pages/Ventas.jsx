import { useState } from 'react'
import { Plus, X, ShoppingCart, Truck, CheckCircle, Clock, CreditCard, Trash2, Edit2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const estadoPagoConfig = {
  pendiente: { label: 'Pendiente', color: '#A32D2D', bg: '#FCEBEB' },
  parcial:   { label: 'Adelanto',  color: '#854F0B', bg: '#FAEEDA' },
  pagado:    { label: 'Pagado',    color: '#3B6D11', bg: '#EAF3DE' },
}

const estadoEntregaConfig = {
  pendiente: { label: 'Pendiente',  color: '#5F5E5A', bg: '#F1EFE8' },
  en_camino: { label: 'En camino', color: '#185FA5', bg: '#E6F1FB' },
  entregado: { label: 'Entregado', color: '#3B6D11', bg: '#EAF3DE' },
}

const mediosPago = ['Efectivo', 'Yape', 'Plin', 'Transferencia']

const formVacio = () => ({
  cliente_nombre: '', cotizacion: '',
  fecha: new Date().toISOString().split('T')[0],
  total: '', adelanto: '', medio_pago: 'Efectivo',
  estado_entrega: 'pendiente', notas: '', evidencia: null,
})

function calcularEstadoPago(total, adelanto) {
  if (adelanto <= 0)     return 'pendiente'
  if (adelanto >= total) return 'pagado'
  return 'parcial'
}

export default function Ventas() {
  const { ventas, setVentas } = useApp()

  const [seleccionada, setSeleccionada]           = useState(null)
  const [mostrarForm, setMostrarForm]             = useState(false)
  const [editandoId, setEditandoId]               = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [form, setForm]                           = useState(formVacio())

  const saldo = (parseFloat(form.total || 0) - parseFloat(form.adelanto || 0)).toFixed(2)

  function handleFoto(e, esModal = false) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      if (esModal) actualizarCampo(seleccionada.id, 'evidencia', ev.target.result)
      else setForm(prev => ({ ...prev, evidencia: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  function actualizarCampo(id, campo, valor) {
    const actualizar = v => {
      if (v.id !== id) return v
      const u = { ...v, [campo]: valor }
      if (campo === 'adelanto') {
        const a = parseFloat(valor || 0)
        u.saldo       = v.total - a
        u.estado_pago = calcularEstadoPago(v.total, a)
      }
      return u
    }
    setVentas(prev => [...prev.map(actualizar)])
    setSeleccionada(prev => prev ? actualizar(prev) : prev)
  }

  function marcarPagadoTotal(id) {
    setVentas(prev => [...prev.map(v => v.id === id ? { ...v, adelanto: v.total, saldo: 0, estado_pago: 'pagado' } : v)])
    setSeleccionada(prev => prev ? { ...prev, adelanto: prev.total, saldo: 0, estado_pago: 'pagado' } : prev)
  }

  function abrirEditar(v) {
    setEditandoId(v.id)
    setForm({
      cliente_nombre: v.cliente_nombre,
      cotizacion:     v.cotizacion     || '',
      fecha:          v.fecha,
      total:          v.total,
      adelanto:       v.adelanto,
      medio_pago:     v.medio_pago,
      estado_entrega: v.estado_entrega,
      notas:          v.notas          || '',
      evidencia:      v.evidencia      || null,
    })
    setSeleccionada(null)
    setMostrarForm(true)
  }

  function eliminarVenta(id) {
    setVentas(prev => [...prev.filter(v => v.id !== id)])
    setSeleccionada(null)
    setConfirmarEliminar(null)
  }

  function guardarVenta() {
    if (!form.cliente_nombre || !form.total) return
    const total    = parseFloat(form.total)
    const adelanto = parseFloat(form.adelanto || 0)
    if (editandoId) {
      setVentas(prev => [...prev.map(v => v.id === editandoId
        ? { ...v, ...form, total, adelanto, saldo: total - adelanto, estado_pago: calcularEstadoPago(total, adelanto) }
        : v
      )])
      setEditandoId(null)
    } else {
      setVentas(prev => [...prev, {
        ...form, id: Date.now(),
        numero: `VTA-${String(ventas.length + 1).padStart(4, '0')}`,
        total, adelanto, saldo: total - adelanto,
        estado_pago: calcularEstadoPago(total, adelanto),
      }])
    }
    setMostrarForm(false)
    setForm(formVacio())
  }

  const totalVentas    = ventas.reduce((s, v) => s + (v.total   || 0), 0)
  const totalCobrado   = ventas.reduce((s, v) => s + (v.adelanto || 0), 0)
  const totalPendiente = ventas.reduce((s, v) => s + (v.saldo   || 0), 0)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Ventas</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{ventas.length} ventas registradas</p>
        </div>
        <button onClick={() => { setEditandoId(null); setForm(formVacio()); setMostrarForm(true) }}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Nueva venta
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Total facturado', valor: `S/ ${totalVentas.toFixed(2)}`,    color: '#2D4A2D' },
            { label: 'Total cobrado',   valor: `S/ ${totalCobrado.toFixed(2)}`,   color: '#3B6D11' },
            { label: 'Saldo pendiente', valor: `S/ ${totalPendiente.toFixed(2)}`, color: '#A32D2D' },
            { label: 'Ventas del mes',  valor: ventas.length,                      color: '#185FA5' },
          ].map((m, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{m.label}</p>
              <p style={{ fontSize: typeof m.valor === 'string' ? '16px' : '24px', fontWeight: '700', color: m.color }}>{m.valor}</p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ventas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8' }}>
              <ShoppingCart size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>No hay ventas registradas aún</p>
            </div>
          ) : ventas.map(v => {
            const ep = estadoPagoConfig[v.estado_pago]
            const ee = estadoEntregaConfig[v.estado_entrega]
            return (
              <div key={v.id}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => setSeleccionada(v)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingCart size={18} color="#3B6D11" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{v.numero}</p>
                      {v.evidencia && <span style={{ fontSize: '10px', backgroundColor: '#EAF3DE', color: '#3B6D11', padding: '1px 7px', borderRadius: '20px', fontWeight: '600' }}>Con evidencia</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{v.cliente_nombre} · {v.fecha} · {v.medio_pago}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#2D4A2D' }}>S/ {(v.total || 0).toFixed(2)}</p>
                    {(v.saldo || 0) > 0 && <p style={{ fontSize: '11px', color: '#A32D2D' }}>Saldo: S/ {(v.saldo || 0).toFixed(2)}</p>}
                  </div>
                  <span style={{ fontSize: '11px', backgroundColor: ep.bg, color: ep.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{ep.label}</span>
                  <span style={{ fontSize: '11px', backgroundColor: ee.bg, color: ee.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{ee.label}</span>
                  <button onClick={() => abrirEditar(v)} style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={14} color="#185FA5" />
                  </button>
                  <button onClick={() => setConfirmarEliminar(v)} style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#A32D2D" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div onClick={() => setConfirmarEliminar(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={32} color="#A32D2D" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>¿Eliminar venta?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará <strong>{confirmarEliminar.numero}</strong> de {confirmarEliminar.cliente_nombre}. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => eliminarVenta(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle venta */}
      {seleccionada && (
        <div onClick={() => setSeleccionada(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionada.numero}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionada.cliente_nombre} · {seleccionada.fecha}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => abrirEditar(seleccionada)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={15} color="#D4C4A0" /></button>
                <button onClick={() => { setConfirmarEliminar(seleccionada); setSeleccionada(null) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={15} color="#f9a0a0" /></button>
                <button onClick={() => setSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Total venta</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#2D4A2D' }}>S/ {(seleccionada.total || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Adelanto recibido</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#3B6D11' }}>S/ {(seleccionada.adelanto || 0).toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid #e0d8c8', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Saldo pendiente</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: (seleccionada.saldo || 0) > 0 ? '#A32D2D' : '#3B6D11' }}>S/ {(seleccionada.saldo || 0).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Actualizar adelanto (S/)</p>
                <input type="number" min="0" max={seleccionada.total} value={seleccionada.adelanto}
                  onChange={e => actualizarCampo(seleccionada.id, 'adelanto', parseFloat(e.target.value || 0))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                {(seleccionada.saldo || 0) > 0 && (
                  <button onClick={() => marcarPagadoTotal(seleccionada.id)}
                    style={{ marginTop: '8px', width: '100%', padding: '9px', borderRadius: '8px', border: '1.5px solid #3B6D11', backgroundColor: '#EAF3DE', color: '#3B6D11', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    ✓ Marcar venta como totalmente cancelada
                  </button>
                )}
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Evidencia de pago (foto)</p>
                {seleccionada.evidencia ? (
                  <div style={{ position: 'relative' }}>
                    <img src={seleccionada.evidencia} alt="Evidencia" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '220px' }} />
                    <button onClick={() => actualizarCampo(seleccionada.id, 'evidencia', null)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', borderRadius: '10px', border: '2px dashed #e0d8c8', cursor: 'pointer', backgroundColor: '#f9f6f0' }}>
                    <CreditCard size={28} color="#888" />
                    <span style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Toca para subir foto del comprobante</span>
                    <input type="file" accept="image/*" capture="environment" onChange={e => handleFoto(e, true)} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Medio de pago</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {mediosPago.map(m => (
                    <button key={m} onClick={() => actualizarCampo(seleccionada.id, 'medio_pago', m)} style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: seleccionada.medio_pago === m ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                      backgroundColor: seleccionada.medio_pago === m ? '#2D4A2D' : '#fff',
                      color: seleccionada.medio_pago === m ? '#D4C4A0' : '#888',
                      fontWeight: seleccionada.medio_pago === m ? '600' : '400',
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Estado de entrega</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(estadoEntregaConfig).map(([k, v]) => (
                    <button key={k} onClick={() => actualizarCampo(seleccionada.id, 'estado_entrega', k)} style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: seleccionada.estado_entrega === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: seleccionada.estado_entrega === k ? v.bg : '#fff',
                      color: seleccionada.estado_entrega === k ? v.color : '#888',
                      fontWeight: seleccionada.estado_entrega === k ? '600' : '400',
                    }}>
                      {k === 'pendiente' && <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                      {k === 'en_camino' && <Truck size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                      {k === 'entregado' && <CheckCircle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: estadoPagoConfig[seleccionada.estado_pago].bg, borderRadius: '8px', padding: '10px 14px' }}>
                <CreditCard size={16} color={estadoPagoConfig[seleccionada.estado_pago].color} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: estadoPagoConfig[seleccionada.estado_pago].color }}>
                  Estado de pago: {estadoPagoConfig[seleccionada.estado_pago].label}
                </span>
              </div>

              {seleccionada.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionada.notas}</p>
                </div>
              )}

              <button onClick={() => setSeleccionada(null)}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                ✓ Aceptar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva / editar venta */}
      {mostrarForm && (
        <div onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar venta' : 'Nueva venta'}</p>
              <button onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Cliente *',                field: 'cliente_nombre', placeholder: 'Nombre del cliente' },
                { label: 'N° Cotización (opcional)', field: 'cotizacion',     placeholder: 'Ej: COT-0001'       },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>{label}</p>
                  <input type="text" placeholder={placeholder} value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Fecha</p>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Total (S/) *</p>
                  <input type="number" min="0" placeholder="0.00" value={form.total}
                    onChange={e => setForm({ ...form, total: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Adelanto recibido (S/)</p>
                <input type="number" min="0" placeholder="0.00" value={form.adelanto}
                  onChange={e => setForm({ ...form, adelanto: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                {form.total && (
                  <>
                    <button onClick={() => setForm(prev => ({ ...prev, adelanto: prev.total }))}
                      style={{ marginTop: '8px', width: '100%', padding: '9px', borderRadius: '8px', border: '1.5px solid #3B6D11', backgroundColor: '#EAF3DE', color: '#3B6D11', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      ✓ Venta totalmente cancelada
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '8px 12px', backgroundColor: '#f9f6f0', borderRadius: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>Saldo pendiente</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: parseFloat(saldo) > 0 ? '#A32D2D' : '#3B6D11' }}>S/ {saldo}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Evidencia de pago (foto)</p>
                {form.evidencia ? (
                  <div style={{ position: 'relative' }}>
                    <img src={form.evidencia} alt="Evidencia" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '220px' }} />
                    <button onClick={() => setForm(prev => ({ ...prev, evidencia: null }))}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', borderRadius: '10px', border: '2px dashed #e0d8c8', cursor: 'pointer', backgroundColor: '#f9f6f0' }}>
                    <CreditCard size={28} color="#888" />
                    <span style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Toca para subir foto del comprobante</span>
                    <input type="file" accept="image/*" capture="environment" onChange={e => handleFoto(e, false)} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Medio de pago</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {mediosPago.map(m => (
                    <button key={m} onClick={() => setForm({ ...form, medio_pago: m })} style={{
                      padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: form.medio_pago === m ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                      backgroundColor: form.medio_pago === m ? '#2D4A2D' : '#fff',
                      color: form.medio_pago === m ? '#D4C4A0' : '#888',
                      fontWeight: form.medio_pago === m ? '600' : '400',
                    }}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Estado de entrega</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(estadoEntregaConfig).map(([k, v]) => (
                    <button key={k} onClick={() => setForm({ ...form, estado_entrega: k })} style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: form.estado_entrega === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: form.estado_entrega === k ? v.bg : '#fff',
                      color: form.estado_entrega === k ? v.color : '#888',
                      fontWeight: form.estado_entrega === k ? '600' : '400',
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button onClick={guardarVenta}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {editandoId ? 'Guardar cambios' : 'Registrar venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
