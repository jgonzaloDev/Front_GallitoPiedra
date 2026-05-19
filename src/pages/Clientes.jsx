import { useState } from 'react'
import { Search, Plus, User, Phone, Mail, MapPin, FileText, X } from 'lucide-react'

const clientesIniciales = [
  { id: 1, nombre: 'Carlos Mendoza', tipo: 'RUC', documento: '20512345678', telefono: '987654321', correo: 'carlos@empresa.com', direccion: 'Av. Los Olivos 234, Lima', tipo_cliente: 'frecuente', notas: 'Compra laja granítica mensualmente' },
  { id: 2, nombre: 'María Quispe',   tipo: 'DNI', documento: '45678912',    telefono: '976543210', correo: 'maria@gmail.com',    direccion: 'Jr. Las Flores 123, Miraflores', tipo_cliente: 'regular',   notas: '' },
  { id: 3, nombre: 'Constructora JyP SAC', tipo: 'RUC', documento: '20698765432', telefono: '01-4567890', correo: 'jyp@constructora.com', direccion: 'Av. Industrial 567, Ate', tipo_cliente: 'mayorista', notas: 'Pedidos grandes, pago a 30 días' },
]

const tipoClienteConfig = {
  frecuente: { label: 'Frecuente', color: '#3B6D11', bg: '#EAF3DE' },
  mayorista: { label: 'Mayorista', color: '#185FA5', bg: '#E6F1FB' },
  regular:   { label: 'Regular',   color: '#5F5E5A', bg: '#F1EFE8' },
}

export default function Clientes() {
  const [clientes, setClientes]       = useState(clientesIniciales)
  const [busqueda, setBusqueda]       = useState('')
  const [filtro, setFiltro]           = useState('todos')
  const [seleccionado, setSeleccionado] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm]               = useState({ nombre: '', tipo: 'DNI', documento: '', telefono: '', correo: '', direccion: '', tipo_cliente: 'regular', notas: '' })

  const filtrados = clientes.filter(c => {
    const coincide = c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                     c.documento.includes(busqueda) ||
                     c.telefono.includes(busqueda)
    const porTipo = filtro === 'todos' || c.tipo_cliente === filtro
    return coincide && porTipo
  })

  function guardarCliente() {
    if (!form.nombre || !form.documento) return
    const nuevo = { ...form, id: Date.now() }
    setClientes([...clientes, nuevo])
    setForm({ nombre: '', tipo: 'DNI', documento: '', telefono: '', correo: '', direccion: '', tipo_cliente: 'regular', notas: '' })
    setMostrarForm(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Clientes</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Total clientes', valor: clientes.length,                                           color: '#2a2a2a' },
            { label: 'Frecuentes',     valor: clientes.filter(c => c.tipo_cliente === 'frecuente').length, color: '#3B6D11' },
            { label: 'Mayoristas',     valor: clientes.filter(c => c.tipo_cliente === 'mayorista').length, color: '#185FA5' },
            { label: 'Regulares',      valor: clientes.filter(c => c.tipo_cliente === 'regular').length,   color: '#5F5E5A' },
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
            <input
              type="text"
              placeholder="Buscar por nombre, documento o teléfono..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['todos', 'frecuente', 'mayorista', 'regular'].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: filtro === f ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                backgroundColor: filtro === f ? '#2D4A2D' : '#fff',
                color: filtro === f ? '#D4C4A0' : '#888',
                fontWeight: filtro === f ? '600' : '400',
              }}>
                {f === 'todos' ? 'Todos' : tipoClienteConfig[f].label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de clientes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtrados.map(c => {
            const tc = tipoClienteConfig[c.tipo_cliente]
            return (
              <div key={c.id}
                onClick={() => setSeleccionado(c)}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color="#3B6D11" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{c.nombre}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.tipo}: {c.documento}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={13} color="#888" />
                    <span style={{ fontSize: '12px', color: '#888' }}>{c.telefono}</span>
                  </div>
                  <span style={{ fontSize: '11px', backgroundColor: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>
                    {tc.label}
                  </span>
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

      {/* Modal ficha de cliente */}
      {seleccionado && (
        <div onClick={() => setSeleccionado(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden' }}>
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
                { icon: Phone,    label: seleccionado.telefono },
                { icon: Mail,     label: seleccionado.correo || 'Sin correo' },
                { icon: MapPin,   label: seleccionado.direccion || 'Sin dirección' },
              ].map(({ icon: Icon, label }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={15} color="#2D4A2D" />
                  <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
                </div>
              ))}
              {seleccionado.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionado.notas}</p>
                </div>
              )}
              <button style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                + Nueva cotización para este cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo cliente */}
      {mostrarForm && (
        <div onClick={() => setMostrarForm(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>Nuevo cliente</p>
              <button onClick={() => setMostrarForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
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
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }}
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' }}>Tipo documento *</p>
                  <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    <option>DNI</option>
                    <option>RUC</option>
                    <option>CE</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#555', marginBottom: '5px', fontWeight: '500' }}>Número *</p>
                  <input type="text" placeholder="Ej: 45678912" value={form.documento}
                    onChange={e => setForm({ ...form, documento: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }}
                  />
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
                    }}>
                      {tipoClienteConfig[t].label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={guardarCliente} style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                Guardar cliente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}