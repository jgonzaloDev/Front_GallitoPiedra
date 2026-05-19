import { useState } from 'react'
import { Plus, X, FileText, Trash2 } from 'lucide-react'

const clientesData = [
  { id: 1, nombre: 'Carlos Mendoza',       documento: '20512345678' },
  { id: 2, nombre: 'María Quispe',          documento: '45678912'    },
  { id: 3, nombre: 'Constructora JyP SAC', documento: '20698765432' },
]

const productosData = [
  'Laja Granítica Ayacuchana',
  'Laja Pizarra Negra',
  'Laja Talomoye',
  'Laja Yura Blanca',
  'Laja Arequipeña',
  'Rococho Arequipeño',
]

const estadoConfig = {
  borrador:  { label: 'Borrador',  color: '#5F5E5A', bg: '#F1EFE8' },
  enviada:   { label: 'Enviada',   color: '#185FA5', bg: '#E6F1FB' },
  aceptada:  { label: 'Aceptada',  color: '#3B6D11', bg: '#EAF3DE' },
  rechazada: { label: 'Rechazada', color: '#A32D2D', bg: '#FCEBEB' },
}

const tipoItemColor = { material: '#2D4A2D', corte: '#854F0B', flete: '#185FA5', instalacion: '#5F5E5A' }
const tipoItemLabel = { material: 'Material', corte: 'Corte', flete: 'Flete', instalacion: 'Instalación' }

const cotizacionesIniciales = [
  {
    id: 1,
    numero: 'COT-0001',
    cliente_id: 1,
    cliente_nombre: 'Carlos Mendoza',
    fecha: '2026-05-18',
    estado: 'enviada',
    igv: true,
    items: [
      { id: 1, tipo: 'material', descripcion: 'Laja Granítica Ayacuchana 20x10', cantidad: 15, unidad: 'm²',      precio_unit: 45,  subtotal: 675 },
      { id: 2, tipo: 'corte',    descripcion: 'Corte a medida 20x10',            cantidad: 1,  unidad: 'servicio', precio_unit: 120, subtotal: 120 },
      { id: 3, tipo: 'flete',    descripcion: 'Flete a Miraflores',              cantidad: 1,  unidad: 'servicio', precio_unit: 80,  subtotal: 80  },
    ],
    total: 1032.50,
    notas: 'Entrega coordinada para el viernes',
  },
]

const itemVacio = () => ({ id: Date.now(), tipo: 'material', descripcion: '', cantidad: 1, unidad: 'm²', precio_unit: 0, subtotal: 0 })

function calcularSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
}

function calcularTotal(items, conIgv) {
  const subtotal = calcularSubtotal(items)
  return conIgv ? subtotal * 1.18 : subtotal
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState(cotizacionesIniciales)
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [seleccionada, setSeleccionada] = useState(null)
  const [form, setForm] = useState({
    cliente_id: '',
    cliente_nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'borrador',
    items: [itemVacio()],
    notas: '',
    igv: false,
  })

  function actualizarItem(id, campo, valor) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item
        const actualizado = { ...item, [campo]: valor }
        if (campo === 'cantidad' || campo === 'precio_unit') {
          actualizado.subtotal = parseFloat(actualizado.cantidad || 0) * parseFloat(actualizado.precio_unit || 0)
        }
        return actualizado
      })
    }))
  }

  function agregarItem() {
    setForm(prev => ({ ...prev, items: [...prev.items, itemVacio()] }))
  }

  function eliminarItem(id) {
    setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
  }

  function guardarCotizacion() {
    if (!form.cliente_id) return
    const total  = calcularTotal(form.items, form.igv)
    const numero = `COT-${String(cotizaciones.length + 1).padStart(4, '0')}`
    const nueva  = { ...form, id: Date.now(), numero, total }
    setCotizaciones([...cotizaciones, nueva])
    setMostrarForm(false)
    setForm({ cliente_id: '', cliente_nombre: '', fecha: new Date().toISOString().split('T')[0], estado: 'borrador', items: [itemVacio()], notas: '', igv: false })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Cotizaciones</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{cotizaciones.length} cotizaciones registradas</p>
        </div>
        <button onClick={() => setMostrarForm(true)}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Nueva cotización
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {Object.entries(estadoConfig).map(([key, val]) => (
            <div key={key} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{val.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: val.color }}>
                {cotizaciones.filter(c => c.estado === key).length}
              </p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cotizaciones.map(c => {
            const est = estadoConfig[c.estado]
            return (
              <div key={c.id} onClick={() => setSeleccionada(c)}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} color="#3B6D11" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{c.numero}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.cliente_nombre} · {c.fecha}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {c.igv && <span style={{ fontSize: '10px', backgroundColor: '#E6F1FB', color: '#185FA5', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>+ IGV</span>}
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#2D4A2D' }}>S/ {c.total.toFixed(2)}</p>
                  <span style={{ fontSize: '11px', backgroundColor: est.bg, color: est.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>
                    {est.label}
                  </span>
                </div>
              </div>
            )
          })}

          {cotizaciones.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <FileText size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>No hay cotizaciones aún</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      {seleccionada && (
        <div onClick={() => setSeleccionada(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionada.numero}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionada.cliente_nombre} · {seleccionada.fecha}</p>
              </div>
              <button onClick={() => setSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalle</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {seleccionada.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f9f6f0', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', backgroundColor: '#fff', color: tipoItemColor[item.tipo], border: `1px solid ${tipoItemColor[item.tipo]}`, padding: '1px 7px', borderRadius: '20px', fontWeight: '600', marginRight: '8px' }}>
                        {tipoItemLabel[item.tipo]}
                      </span>
                      <span style={{ fontSize: '13px', color: '#2a2a2a' }}>{item.descripcion}</span>
                      <p style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>{item.cantidad} {item.unidad} × S/ {item.precio_unit}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>S/ {item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Desglose total */}
              <div style={{ borderTop: '2px solid #e0d8c8', paddingTop: '12px', marginBottom: '16px' }}>
                {seleccionada.igv && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>Subtotal</span>
                      <span style={{ fontSize: '13px', color: '#555' }}>S/ {calcularSubtotal(seleccionada.items).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>IGV (18%)</span>
                      <span style={{ fontSize: '13px', color: '#555' }}>S/ {(calcularSubtotal(seleccionada.items) * 0.18).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#2a2a2a' }}>Total {seleccionada.igv ? '(inc. IGV)' : ''}</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#2D4A2D' }}>S/ {seleccionada.total.toFixed(2)}</p>
                </div>
              </div>

              {seleccionada.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionada.notas}</p>
                </div>
              )}

              <button style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Confirmar como venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva cotización */}
      {mostrarForm && (
        <div onClick={() => setMostrarForm(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>Nueva cotización</p>
              <button onClick={() => setMostrarForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Cliente */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Cliente *</p>
                <select value={form.cliente_id}
                  onChange={e => {
                    const c = clientesData.find(c => c.id === parseInt(e.target.value))
                    setForm({ ...form, cliente_id: e.target.value, cliente_nombre: c ? c.nombre : '' })
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                  <option value="">Selecciona un cliente...</option>
                  {clientesData.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Fecha y estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Fecha</p>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Estado</p>
                  <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    {Object.entries(estadoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>Ítems de la cotización</p>
                  <button onClick={agregarItem} style={{ fontSize: '12px', color: '#2D4A2D', background: 'none', border: '1px solid #2D4A2D', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={13} /> Agregar ítem
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {form.items.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(tipoItemLabel).map(([k, v]) => (
                            <button key={k} onClick={() => actualizarItem(item.id, 'tipo', k)} style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer',
                              border: item.tipo === k ? `1.5px solid ${tipoItemColor[k]}` : '1px solid #e0d8c8',
                              backgroundColor: item.tipo === k ? tipoItemColor[k] : '#fff',
                              color: item.tipo === k ? '#fff' : '#888',
                              fontWeight: item.tipo === k ? '600' : '400',
                            }}>{v}</button>
                          ))}
                        </div>
                        {form.items.length > 1 && (
                          <button onClick={() => eliminarItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {item.tipo === 'material' ? (
                        <select value={item.descripcion} onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff', marginBottom: '8px' }}>
                          <option value="">Selecciona producto...</option>
                          {productosData.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder="Descripción del servicio..." value={item.descripcion}
                          onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <div>
                          <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Cantidad</p>
                          <input type="number" min="0" value={item.cantidad}
                            onChange={e => actualizarItem(item.id, 'cantidad', e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Unidad</p>
                          <select value={item.unidad} onChange={e => actualizarItem(item.id, 'unidad', e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                            <option>m²</option>
                            <option>ml</option>
                            <option>cm²</option>
                            <option>servicio</option>
                            <option>unidad</option>
                          </select>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Precio unit. (S/)</p>
                          <input type="number" min="0" value={item.precio_unit}
                            onChange={e => actualizarItem(item.id, 'precio_unit', e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D4A2D' }}>
                          Subtotal: S/ {(item.subtotal || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bloque total con IGV */}
                <div style={{ marginTop: '12px', backgroundColor: '#2D4A2D', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

                  {/* Toggle IGV */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#a0b89a', fontSize: '13px' }}>Incluir IGV (18%)</span>
                    <div
                      onClick={() => setForm(prev => ({ ...prev, igv: !prev.igv }))}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', backgroundColor: form.igv ? '#D4C4A0' : 'rgba(255,255,255,0.2)', position: 'relative', transition: 'background 0.2s' }}
                    >
                      <div style={{ position: 'absolute', top: '3px', left: form.igv ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: form.igv ? '#2D4A2D' : '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>

                  {/* Desglose si IGV activo */}
                  {form.igv && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a0b89a', fontSize: '12px' }}>Subtotal</span>
                        <span style={{ color: '#D4C4A0', fontSize: '12px' }}>S/ {calcularSubtotal(form.items).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#a0b89a', fontSize: '12px' }}>IGV (18%)</span>
                        <span style={{ color: '#D4C4A0', fontSize: '12px' }}>S/ {(calcularSubtotal(form.items) * 0.18).toFixed(2)}</span>
                      </div>
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '4px' }} />
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#D4C4A0', fontSize: '14px', fontWeight: '600' }}>
                      Total {form.igv ? '(inc. IGV)' : ''}
                    </span>
                    <span style={{ color: '#D4C4A0', fontSize: '18px', fontWeight: '700' }}>
                      S/ {calcularTotal(form.items, form.igv).toFixed(2)}
                    </span>
                  </div>

                </div>
              </div>

              {/* Notas */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones, condiciones de entrega..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <button onClick={guardarCotizacion}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Guardar cotización
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
