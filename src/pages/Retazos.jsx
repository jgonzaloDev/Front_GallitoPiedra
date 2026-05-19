import { useState, useMemo } from 'react'
import { Plus, X, Search, Trash2, Edit2, Camera, Package } from 'lucide-react'
import { useApp } from '../context/AppContext'

const tiposPiedra = [
  'Laja Granítica Ayacuchana', 'Laja Pizarra Negra', 'Laja Talomoye',
  'Laja Yura Blanca', 'Laja Arequipeña', 'Rococho Arequipeño',
]

const estadoConfig = {
  disponible: { label: 'Disponible',  color: '#3B6D11', bg: '#EAF3DE' },
  reservado:  { label: 'Reservado',   color: '#185FA5', bg: '#E6F1FB' },
  parcial:    { label: 'Uso parcial', color: '#854F0B', bg: '#FAEEDA' },
  agotado:    { label: 'Agotado',     color: '#A32D2D', bg: '#FCEBEB' },
}

const usoConfig = {
  venta: { label: 'Venta directa', color: '#185FA5', bg: '#E6F1FB' },
  corte: { label: 'Para corte',    color: '#854F0B', bg: '#FAEEDA' },
  ambos: { label: 'Venta / Corte', color: '#2D4A2D', bg: '#EAF3DE' },
}

const formVacio = () => ({
  tipo_piedra: '', largo_cm: '', ancho_cm: '', ubicacion: '',
  precio_m2: '', precio_pieza: '', uso: 'ambos', estado: 'disponible', notas: '', foto: null,
})

export default function Retazos() {
  const { retazos, setRetazos } = useApp()

  const [seleccionado, setSeleccionado]           = useState(null)
  const [mostrarForm, setMostrarForm]             = useState(false)
  const [editandoId, setEditandoId]               = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [busqueda, setBusqueda]                   = useState('')
  const [filtroTipo, setFiltroTipo]               = useState('todos')
  const [filtroEstado, setFiltroEstado]           = useState('todos')
  const [minArea, setMinArea]                     = useState('')
  const [form, setForm]                           = useState(formVacio())

  const areaCalculada = form.largo_cm && form.ancho_cm
    ? ((parseFloat(form.largo_cm) * parseFloat(form.ancho_cm)) / 10000).toFixed(3)
    : null

  function handleFoto(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(prev => ({ ...prev, foto: ev.target.result }))
    reader.readAsDataURL(file)
  }

  function handleFotoModal(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => actualizarCampo(seleccionado.id, 'foto', ev.target.result)
    reader.readAsDataURL(file)
  }

  function actualizarCampo(id, campo, valor) {
    const actualizar = r => r.id === id ? { ...r, [campo]: valor } : r
    setRetazos(prev => [...prev.map(actualizar)])
    setSeleccionado(prev => prev ? actualizar(prev) : prev)
  }

  function abrirEditar(r) {
    setEditandoId(r.id)
    setForm({
      tipo_piedra:  r.tipo_piedra,
      largo_cm:     r.largo_cm,
      ancho_cm:     r.ancho_cm,
      ubicacion:    r.ubicacion    || '',
      precio_m2:    r.precio_m2    || '',
      precio_pieza: r.precio_pieza || '',
      uso:          r.uso,
      estado:       r.estado,
      notas:        r.notas        || '',
      foto:         r.foto         || null,
    })
    setSeleccionado(null)
    setMostrarForm(true)
  }

  function eliminarRetazo(id) {
    setRetazos(prev => [...prev.filter(r => r.id !== id)])
    setSeleccionado(null)
    setConfirmarEliminar(null)
  }

  function guardarRetazo() {
    if (!form.tipo_piedra || !form.largo_cm || !form.ancho_cm) return
    const area = parseFloat(((parseFloat(form.largo_cm) * parseFloat(form.ancho_cm)) / 10000).toFixed(3))
    if (editandoId) {
      setRetazos(prev => [...prev.map(r => r.id === editandoId ? { ...r, ...form, area_m2: area } : r)])
      setEditandoId(null)
    } else {
      setRetazos(prev => [...prev, { ...form, id: Date.now(), area_m2: area, fecha_ingreso: new Date().toISOString().split('T')[0] }])
    }
    setMostrarForm(false)
    setForm(formVacio())
  }

  const retazosFiltrados = useMemo(() => retazos.filter(r => {
    const coincideBusqueda = r.tipo_piedra.toLowerCase().includes(busqueda.toLowerCase()) ||
                             (r.ubicacion || '').toLowerCase().includes(busqueda.toLowerCase())
    const coincideTipo   = filtroTipo   === 'todos' || r.tipo_piedra === filtroTipo
    const coincideEstado = filtroEstado === 'todos' || r.estado      === filtroEstado
    const coincideArea   = !minArea || r.area_m2 >= parseFloat(minArea)
    return coincideBusqueda && coincideTipo && coincideEstado && coincideArea
  }), [retazos, busqueda, filtroTipo, filtroEstado, minArea])

  const conteo = {
    total:      retazos.length,
    disponible: retazos.filter(r => r.estado === 'disponible').length,
    reservado:  retazos.filter(r => r.estado === 'reservado').length,
    parcial:    retazos.filter(r => r.estado === 'parcial').length,
    agotado:    retazos.filter(r => r.estado === 'agotado').length,
    area_total: retazos.filter(r => r.estado !== 'agotado').reduce((s, r) => s + (r.area_m2 || 0), 0).toFixed(2),
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Inventario de retazos</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{retazos.length} retazos · {conteo.area_total} m² disponibles</p>
        </div>
        <button onClick={() => { setEditandoId(null); setForm(formVacio()); setMostrarForm(true) }}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Nuevo retazo
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Total retazos', valor: conteo.total,      color: '#2a2a2a' },
            { label: 'Disponibles',   valor: conteo.disponible, color: '#3B6D11' },
            { label: 'Reservados',    valor: conteo.reservado,  color: '#185FA5' },
            { label: 'Uso parcial',   valor: conteo.parcial,    color: '#854F0B' },
            { label: 'Agotados',      valor: conteo.agotado,    color: '#A32D2D' },
            { label: 'Área total m²', valor: conteo.area_total, color: '#2D4A2D' },
          ].map((m, i) => (
            <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '12px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{m.label}</p>
              <p style={{ fontSize: i === 5 ? '16px' : '22px', fontWeight: '700', color: m.color }}>{m.valor}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input type="text" placeholder="Buscar por tipo o ubicación..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>Área mínima:</span>
            <input type="number" min="0" step="0.1" placeholder="m²" value={minArea} onChange={e => setMinArea(e.target.value)}
              style={{ width: '70px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['todos', ...Object.keys(estadoConfig)].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              border: filtroEstado === e ? `1.5px solid ${e === 'todos' ? '#2D4A2D' : estadoConfig[e].color}` : '1px solid #e0d8c8',
              backgroundColor: filtroEstado === e ? (e === 'todos' ? '#2D4A2D' : estadoConfig[e].bg) : '#fff',
              color: filtroEstado === e ? (e === 'todos' ? '#D4C4A0' : estadoConfig[e].color) : '#888',
              fontWeight: filtroEstado === e ? '600' : '400',
            }}>{e === 'todos' ? 'Todos' : estadoConfig[e].label}</button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['todos', ...tiposPiedra].map(t => (
            <button key={t} onClick={() => setFiltroTipo(t)} style={{
              padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
              border: filtroTipo === t ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
              backgroundColor: filtroTipo === t ? '#2D4A2D' : '#fff',
              color: filtroTipo === t ? '#D4C4A0' : '#888',
              fontWeight: filtroTipo === t ? '600' : '400',
            }}>{t === 'todos' ? 'Todos los tipos' : t.replace('Laja ', '').replace('Rococho ', '')}</button>
          ))}
        </div>

        {retazos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8' }}>
            <Package size={40} style={{ opacity: 0.2, marginBottom: '14px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', marginBottom: '6px' }}>No hay retazos registrados</p>
            <p style={{ fontSize: '13px' }}>Agrega el primer retazo con el botón de arriba.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
            {retazosFiltrados.map(r => {
              const est = estadoConfig[r.estado]
              const uso = usoConfig[r.uso]
              return (
                <div key={r.id}
                  style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  onClick={() => setSeleccionado(r)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ height: '130px', backgroundColor: '#f0ebe0', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.foto ? (
                      <img src={r.foto} alt={r.tipo_piedra} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <Package size={32} color="#c4b898" />
                        <span style={{ fontSize: '11px', color: '#c4b898' }}>Sin foto</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(45,74,45,0.85)', borderRadius: '20px', padding: '3px 8px' }}>
                      <span style={{ fontSize: '11px', color: '#D4C4A0', fontWeight: '600' }}>{r.area_m2} m²</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#2a2a2a', marginBottom: '3px' }}>{r.tipo_piedra}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{r.largo_cm} × {r.ancho_cm} cm · {r.ubicacion || 'Sin ubicación'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', backgroundColor: est.bg, color: est.color, padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>{est.label}</span>
                      <span style={{ fontSize: '11px', backgroundColor: uso.bg, color: uso.color, padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>{uso.label}</span>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      {r.precio_m2    && <span style={{ fontSize: '12px', color: '#2D4A2D', fontWeight: '600' }}>S/ {r.precio_m2}/m²</span>}
                      {r.precio_pieza && <span style={{ fontSize: '12px', color: '#2D4A2D', fontWeight: '600' }}>S/ {r.precio_pieza}/pza</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => abrirEditar(r)} style={{ flex: 1, padding: '6px', borderRadius: '7px', border: 'none', backgroundColor: '#E6F1FB', fontSize: '12px', cursor: 'pointer', color: '#185FA5', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Edit2 size={13} /> Editar
                      </button>
                      <button onClick={() => setConfirmarEliminar(r)} style={{ flex: 1, padding: '6px', borderRadius: '7px', border: 'none', backgroundColor: '#FCEBEB', fontSize: '12px', cursor: 'pointer', color: '#A32D2D', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <Trash2 size={13} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {seleccionado && (
        <div onClick={() => setSeleccionado(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionado.tipo_piedra}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionado.largo_cm} × {seleccionado.ancho_cm} cm · {seleccionado.area_m2} m²</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => abrirEditar(seleccionado)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={15} color="#D4C4A0" /></button>
                <button onClick={() => { setConfirmarEliminar(seleccionado); setSeleccionado(null) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={15} color="#f9a0a0" /></button>
                <button onClick={() => setSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Foto del retazo</p>
                {seleccionado.foto ? (
                  <div style={{ position: 'relative' }}>
                    <img src={seleccionado.foto} alt="Retazo" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '200px' }} />
                    <button onClick={() => actualizarCampo(seleccionado.id, 'foto', null)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#fff" /></button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', borderRadius: '10px', border: '2px dashed #e0d8c8', cursor: 'pointer', backgroundColor: '#f9f6f0' }}>
                    <Camera size={28} color="#888" />
                    <span style={{ fontSize: '13px', color: '#888' }}>Toca para agregar foto</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFotoModal} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Tipo de piedra', valor: seleccionado.tipo_piedra },
                  { label: 'Dimensiones',    valor: `${seleccionado.largo_cm} × ${seleccionado.ancho_cm} cm` },
                  { label: 'Área',           valor: `${seleccionado.area_m2} m²` },
                  { label: 'Ubicación',      valor: seleccionado.ubicacion    || '—' },
                  { label: 'Precio m²',      valor: seleccionado.precio_m2    ? `S/ ${seleccionado.precio_m2}`    : '—' },
                  { label: 'Precio pieza',   valor: seleccionado.precio_pieza ? `S/ ${seleccionado.precio_pieza}` : '—' },
                ].map(({ label, valor }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{label}</span>
                    <span style={{ fontSize: '13px', color: '#2a2a2a', fontWeight: '500', textAlign: 'right' }}>{valor}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Estado</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(estadoConfig).map(([k, v]) => (
                    <button key={k} onClick={() => actualizarCampo(seleccionado.id, 'estado', k)} style={{
                      padding: '9px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: seleccionado.estado === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: seleccionado.estado === k ? v.bg : '#fff',
                      color: seleccionado.estado === k ? v.color : '#888',
                      fontWeight: seleccionado.estado === k ? '600' : '400',
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Uso</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(usoConfig).map(([k, v]) => (
                    <button key={k} onClick={() => actualizarCampo(seleccionado.id, 'uso', k)} style={{
                      flex: 1, padding: '9px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                      border: seleccionado.uso === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: seleccionado.uso === k ? v.bg : '#fff',
                      color: seleccionado.uso === k ? v.color : '#888',
                      fontWeight: seleccionado.uso === k ? '600' : '400',
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
              {seleccionado.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionado.notas}</p>
                </div>
              )}
              <button onClick={() => setSeleccionado(null)} style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                ✓ Aceptar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div onClick={() => setConfirmarEliminar(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={32} color="#A32D2D" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>¿Eliminar retazo?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará el retazo de <strong>{confirmarEliminar.tipo_piedra}</strong>. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => eliminarRetazo(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo / editar */}
      {mostrarForm && (
        <div onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar retazo' : 'Nuevo retazo'}</p>
              <button onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Foto del retazo</p>
                {form.foto ? (
                  <div style={{ position: 'relative' }}>
                    <img src={form.foto} alt="Retazo" style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '180px' }} />
                    <button onClick={() => setForm(prev => ({ ...prev, foto: null }))} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="#fff" /></button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '20px', borderRadius: '10px', border: '2px dashed #e0d8c8', cursor: 'pointer', backgroundColor: '#f9f6f0' }}>
                    <Camera size={26} color="#888" />
                    <span style={{ fontSize: '13px', color: '#888' }}>Toca para tomar foto o seleccionar</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Tipo de piedra *</p>
                <select value={form.tipo_piedra} onChange={e => setForm({ ...form, tipo_piedra: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                  <option value="">Selecciona el tipo...</option>
                  {tiposPiedra.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Dimensiones *</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Largo (cm)</p>
                    <input type="number" min="0" placeholder="Ej: 80" value={form.largo_cm}
                      onChange={e => setForm({ ...form, largo_cm: e.target.value })}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Ancho (cm)</p>
                    <input type="number" min="0" placeholder="Ej: 60" value={form.ancho_cm}
                      onChange={e => setForm({ ...form, ancho_cm: e.target.value })}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Área</p>
                    <div style={{ padding: '9px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#f9f6f0', fontSize: '13px', fontWeight: '600', color: '#2D4A2D' }}>
                      {areaCalculada ? `${areaCalculada} m²` : '—'}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Ubicación en el patio</p>
                <input type="text" placeholder="Ej: Zona A - Pila 1" value={form.ubicacion}
                  onChange={e => setForm({ ...form, ubicacion: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Precio por m² (S/)</p>
                  <input type="number" min="0" placeholder="Ej: 35" value={form.precio_m2}
                    onChange={e => setForm({ ...form, precio_m2: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Precio por pieza (S/)</p>
                  <input type="number" min="0" placeholder="Ej: 25" value={form.precio_pieza}
                    onChange={e => setForm({ ...form, precio_pieza: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Uso del retazo</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(usoConfig).map(([k, v]) => (
                    <button key={k} onClick={() => setForm({ ...form, uso: k })} style={{
                      flex: 1, padding: '9px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: form.uso === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: form.uso === k ? v.bg : '#fff',
                      color: form.uso === k ? v.color : '#888',
                      fontWeight: form.uso === k ? '600' : '400',
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Estado</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(estadoConfig).map(([k, v]) => (
                    <button key={k} onClick={() => setForm({ ...form, estado: k })} style={{
                      padding: '9px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: form.estado === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: form.estado === k ? v.bg : '#fff',
                      color: form.estado === k ? v.color : '#888',
                      fontWeight: form.estado === k ? '600' : '400',
                    }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones, condición del retazo..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button onClick={guardarRetazo}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {editandoId ? 'Guardar cambios' : 'Registrar retazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
