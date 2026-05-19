import { useState } from 'react'
import { Search, Plus, User, Phone, Mail, MapPin, FileText, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const tipoClienteConfig = {
  frecuente: { label: 'Frecuente', color: '#3B6D11', bg: '#EAF3DE' },
  mayorista: { label: 'Mayorista', color: '#185FA5', bg: '#E6F1FB' },
  regular:   { label: 'Regular',   color: '#5F5E5A', bg: '#F1EFE8' },
}

export default function Clientes() {
  const { clientes, setClientes, cotizaciones, ventas } = useApp()

  const [busqueda, setBusqueda]           = useState('')
  const [filtro, setFiltro]               = useState('todos')
  const [seleccionado, setSeleccionado]   = useState(null)
  const [mostrarForm, setMostrarForm]     = useState(false)
  const [editandoId, setEditandoId]       = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [form, setForm] = useState({
    nombre: '', tipo: 'DNI', documento: '', telefono: '',
    correo: '', direccion: '', tipo_cliente: 'regular', notas: ''
  })

  const filtrados = clientes.filter(c => {
    const coincide = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                     c.documento.includes(busqueda) ||
                     (c.telefono || '').includes(busqueda)
    const porTipo  = filtro === 'todos' || c.tipo_cliente === filtro
    return coincide && porTipo
  })

  function abrirEditar(c) {
    setEditandoId(c.id)
    setForm({
      nombre:       c.nombre,
      tipo:         c.tipo,
      documento:    c.documento,
      telefono:     c.telefono    || '',
      correo:       c.correo      || '',
      direccion:    c.direccion   || '',
      tipo_cliente: c.tipo_cliente,
      notas:        c.notas       || '',
    })
    setSeleccionado(null)
    setMostrarForm(true)
  }

  function eliminarCliente(id) {
    setClientes(prev => [...prev.filter(c => c.id !== id)])
    setSeleccionado(null)
    setConfirmarEliminar(null)
  }

  function guardarCliente() {
    if (!form.nombre || !form.documento) return
    if (editandoId) {
      setClientes(prev => [...prev.map(c => c.id === editandoId ? { ...c, ...form } : c)])
      setEditandoId(null)
    } else {
      setClientes(prev => [...prev, { ...form, id: Date.now() }])
    }
    setForm({ nombre: '', tipo: 'DNI', documento: '', telefono: '', correo: '', direccion: '', tipo_cliente: 'regular', notas: '' })
    setMostrarForm(false)
  }

  // Historial del cliente seleccionado
  const historialVentas      = ventas.filter(v => v.cliente_nombre === seleccionado?.nombre)
  const historialCotizaciones = cotizaciones.filter(c => c.cliente_nombre === seleccionado?.nombre)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Clientes</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{clientes.length} clientes registrados</p>
        </div>
        <button onClick={() => { setEditandoId(null); setForm({ nombre: '', tipo: 'DNI', documento: '', telefono: '', correo: '', direccion: '', tipo_cliente: 'regular', notas: '' }); setMostrarForm(true) }}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Total clientes', valor: clientes.length,                                              color: '#2a2a2a' },
            { label: 'Frecuentes',     valor: clientes.filter(c => c.tipo_cliente === 'frecuente').length,  color: '#3B6D11' },
            { label: 'Mayoristas',     valor: clientes.filter(c => c.tipo_cliente === 'mayorista').length,  color: '#185FA5' },
            { label: 'Regulares',      valor: clientes.filter(c => c.tipo_cliente === 'regular').length,    color: '#5F5E5A' },
          ].map((m, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{m.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: m.color }}>{m.valor}</p>
            </div>
          ))}
        </div>

        {/* Buscador y filtros */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input type="text" placeholder="Buscar por nombre, documento o teléfono..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['todos', 'frecuente', 'mayorista', 'regular'].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                border: filtro === f ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                backgroundColor: filtro === f ? '#2D4A2D' : '#fff',
                color: filtro === f ? '#D4C4A0' : '#888',
                fontWeight: filtro === f ? '600' : '400',
              }}>{f === 'todos' ? 'Todos' : tipoClienteConfig[f].label}</button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtrados.map(c => {
            const tc = tipoClienteConfig[c.tipo_cliente]
            return (
              <div key={c.id}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }} onClick={() => setSeleccionado(c)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color="#3B6D11" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{c.nombre}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.tipo}: {c.documento}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {c.telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} color="#888" />
                      <span style={{ fontSize: '12px', color: '#888' }}>{c.telefono}</span>
                    </div>
                  )}
                  <span style={{ fontSize: '11px', backgroundColor: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{tc.label}</span>
                  <button onClick={e => { e.stopPropagation(); abrirEditar(c) }}
                    style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <FileText size={14} color="#185FA5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setConfirmarEliminar(c) }}
                    style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <X size={14} color="#A32D2D" />
                  </button>
                </div>
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <User size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>No se encontraron clientes</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal ficha cliente */}
      {seleccionado && (
        <div onClick={() => setSeleccionado(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(212,196,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="#D4C4A0" />
                </div>
                <div>
                  <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionado.nombre}</p>
                  <span style={{ fontSize: '11px', backgroundColor: tipoClienteConfig[seleccionado.tipo_cliente].bg, color: tipoClienteConfig[seleccionado.tipo_cliente].color, padding: '2px 8px', borderRadius: '20px' }}>
                    {tipoClienteConfig[seleccionado.tipo_cliente].label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: FileText, label: `${seleccionado.tipo}: ${seleccionado.documento}` },
                { icon: Phone,    label: seleccionado.telefono  || 'Sin teléfono' },
                { icon: Mail,     label: seleccionado.correo    || 'Sin correo' },
                { icon: MapPin,   label: seleccionado.direccion || 'Sin dirección' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={15} color="#2D4A2D" />
                  <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
                </div>
              ))}
              {seleccionado.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionado.notas}</p>
                </div>
              )}

              {/* Historial ventas */}
              {historialVentas.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#2D4A2D', marginBottom: '8px' }}>Historial de ventas ({historialVentas.length})</p>
                  {historialVentas.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0ebe0', fontSize: '12px' }}>
                      <span style={{ color: '#555' }}>{v.numero} · {v.fecha}</span>
                      <span style={{ color: '#2D4A2D', fontWeight: '600' }}>S/ {v.total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Historial cotizaciones */}
              {historialCotizaciones.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#2D4A2D', marginBottom: '8px' }}>Cotizaciones ({historialCotizaciones.length})</p>
                  {historialCotizaciones.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0ebe0', fontSize: '12px' }}>
                      <span style={{ color: '#555' }}>{c.numero} · {c.fecha}</span>
                      <span style={{ color: '#2D4A2D', fontWeight: '600' }}>S/ {c.total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => abrirEditar(seleccionado)}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                Editar cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div onClick={() => setConfirmarEliminar(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#2a2a2a', marginBottom: '6px' }}>¿Eliminar cliente?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará <strong>{confirmarEliminar.nombre}</strong>. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={() => eliminarCliente(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo / editar cliente */}
      {mostrarForm && (
        <div onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar cliente' : 'Nuevo cliente'}</p>
              <button onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Nombre completo / Razón social *', field: 'nombre',    type: 'text',  placeholder: 'Ej: Carlos Mendoza' },
                { label: 'Teléfono',                         field: 'telefono',  type: 'text',  placeholder: 'Ej: 987654321' },
                { label: 'Correo electrónico',               field: 'correo',    type: 'email', placeholder: 'Ej: cliente@correo.com' },
                { label: 'Dirección',                        field: 'direccion', type: 'text',  placeholder: 'Ej: Av. Los Olivos 234, Lima' },
                { label: 'Notas',                            field: 'notas',     type: 'text',  placeholder: 'Preferencias, observaciones...' },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' }}>{label}</p>
                  <input type={type} placeholder={placeholder} value={form[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' }}>Tipo documento *</p>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    <option>DNI</option><option>RUC</option><option>CE</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' }}>Número *</p>
                  <input type="text" placeholder="Ej: 45678912" value={form.documento}
                    onChange={e => setForm({ ...form, documento: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' }}>Tipo de cliente</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['regular', 'frecuente', 'mayorista'].map(t => (
                    <button key={t} onClick={() => setForm({ ...form, tipo_cliente: t })} style={{
                      flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: form.tipo_cliente === t ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                      backgroundColor: form.tipo_cliente === t ? '#2D4A2D' : '#fff',
                      color: form.tipo_cliente === t ? '#D4C4A0' : '#888',
                      fontWeight: form.tipo_cliente === t ? '600' : '400',
                    }}>{tipoClienteConfig[t].label}</button>
                  ))}
                </div>
              </div>
              <button onClick={guardarCliente}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {editandoId ? 'Guardar cambios' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
