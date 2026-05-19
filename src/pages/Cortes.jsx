import { useState, useMemo } from 'react'
import { Plus, X, Scissors, CheckCircle, Clock, AlertTriangle, Trash2, Edit2, BarChart2, Download } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const cortadores = ['Freddy', 'Angelo', 'Jorge', 'Eduardo', 'Pedro', 'Héctor']

const productosData = [
  'Laja Granítica Ayacuchana', 'Laja Pizarra Negra', 'Laja Talomoye',
  'Laja Yura Blanca', 'Laja Arequipeña', 'Rococho Arequipeño',
]

const estadoConfig = {
  asignada:   { label: 'Asignada',   color: '#185FA5', bg: '#E6F1FB' },
  en_proceso: { label: 'En proceso', color: '#854F0B', bg: '#FAEEDA' },
  completada: { label: 'Completada', color: '#3B6D11', bg: '#EAF3DE' },
  cancelada:  { label: 'Cancelada',  color: '#A32D2D', bg: '#FCEBEB' },
}

const COLORES_CORTADORES = ['#2D4A2D', '#4a7c59', '#6aaa82', '#854F0B', '#185FA5', '#A32D2D']

const formVacio = () => ({
  cliente: '', cotizacion: '', cortador: 'Freddy', producto: '',
  medidas: '', cantidad: 1, unidad: 'm²', descripcion: '',
  prioridad: 'normal', fecha: new Date().toISOString().split('T')[0],
  notas: '', metraje_producido: '',
})

const ordenesIniciales = [
  
  { id: 13, numero: 'COR-0013', cliente: 'Constructora ABC',   cotizacion: 'COT-0013', cortador: 'Héctor',  producto: 'Rococho Arequipeño',         medidas: '10x10 cm', cantidad: 20, unidad: 'm²', descripcion: 'Corte estándar',      prioridad: 'urgente', fecha: '2026-05-19', estado: 'asignada',   notas: 'Para mañana', metraje_producido: null },
]

export default function Cortes() {
  const [ordenes, setOrdenes]                           = useState(ordenesIniciales)
  const [seleccionada, setSeleccionada]                 = useState(null)
  const [mostrarForm, setMostrarForm]                   = useState(false)
  const [mostrarProductividad, setMostrarProductividad] = useState(false)
  const [editandoId, setEditandoId]                     = useState(null)
  const [confirmarEliminar, setConfirmarEliminar]       = useState(null)
  const [pedirMetraje, setPedirMetraje]                 = useState(null)
  const [filtroCortador, setFiltroCortador]             = useState('todos')
  const [filtroEstado, setFiltroEstado]                 = useState('todos')
  const [vistaInforme, setVistaInforme]                 = useState('dia')
  const [fechaBase, setFechaBase]                       = useState(new Date().toISOString().split('T')[0])
  const [form, setForm]                                 = useState(formVacio())

  // ─── Cálculos productividad ──────────────────────────────────────────────────

  const datosInforme = useMemo(() => {
    const completadas = ordenes.filter(o => o.estado === 'completada' && o.metraje_producido)
    if (vistaInforme === 'dia') {
      return cortadores.map(nombre => ({
        nombre,
        total: parseFloat(completadas.filter(o => o.cortador === nombre && o.fecha === fechaBase).reduce((s, o) => s + parseFloat(o.metraje_producido), 0).toFixed(2))
      })).filter(c => c.total > 0)
    }
    if (vistaInforme === 'semana') {
      const dias = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(fechaBase); d.setDate(d.getDate() - i)
        const fecha = d.toISOString().split('T')[0]
        const entry = { fecha: fecha.slice(5) }
        cortadores.forEach(nombre => {
          entry[nombre] = parseFloat(completadas.filter(o => o.cortador === nombre && o.fecha === fecha).reduce((s, o) => s + parseFloat(o.metraje_producido), 0).toFixed(2))
        })
        dias.push(entry)
      }
      return dias
    }
    if (vistaInforme === 'mes') {
      const semanas = []
      for (let s = 3; s >= 0; s--) {
        const inicio = new Date(fechaBase); inicio.setDate(inicio.getDate() - (s * 7) - 6)
        const fin    = new Date(fechaBase); fin.setDate(fin.getDate() - (s * 7))
        const entry  = { semana: `S${4 - s}` }
        cortadores.forEach(nombre => {
          entry[nombre] = parseFloat(completadas.filter(o => { const f = new Date(o.fecha); return o.cortador === nombre && f >= inicio && f <= fin }).reduce((s, o) => s + parseFloat(o.metraje_producido), 0).toFixed(2))
        })
        semanas.push(entry)
      }
      return semanas
    }
    return []
  }, [ordenes, vistaInforme, fechaBase])

  const tablaResumen = useMemo(() => {
    const completadas = ordenes.filter(o => o.estado === 'completada' && o.metraje_producido)
    return cortadores.map(nombre => {
      let filtradas = completadas.filter(o => o.cortador === nombre)
      if (vistaInforme === 'dia') {
        filtradas = filtradas.filter(o => o.fecha === fechaBase)
      } else if (vistaInforme === 'semana') {
        const inicio = new Date(fechaBase); inicio.setDate(inicio.getDate() - 6)
        filtradas = filtradas.filter(o => new Date(o.fecha) >= inicio && new Date(o.fecha) <= new Date(fechaBase))
      } else {
        const inicio = new Date(fechaBase); inicio.setDate(inicio.getDate() - 27)
        filtradas = filtradas.filter(o => new Date(o.fecha) >= inicio && new Date(o.fecha) <= new Date(fechaBase))
      }
      const total = filtradas.reduce((s, o) => s + parseFloat(o.metraje_producido), 0)
      const dias  = new Set(filtradas.map(o => o.fecha)).size
      return { nombre, ordenes: filtradas.length, total: parseFloat(total.toFixed(2)), promedio: dias > 0 ? parseFloat((total / dias).toFixed(2)) : 0 }
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)
  }, [ordenes, vistaInforme, fechaBase])

  const totalPeriodo = tablaResumen.reduce((s, c) => s + c.total, 0).toFixed(2)

  // ─── Exportar PDF ─────────────────────────────────────────────────────────────

  function exportarPDF() {
    const doc = new jsPDF()
    const periodoLabel = vistaInforme === 'dia' ? `Día: ${fechaBase}` : vistaInforme === 'semana' ? `Semana al: ${fechaBase}` : `Mes al: ${fechaBase}`
    doc.setFillColor(45, 74, 45); doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(212, 196, 160); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('Decoraciones Gallito y Piedra', 14, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Informe de Productividad por Cortador', 14, 20)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 150, 20)
    doc.setTextColor(45, 74, 45); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text(`Período: ${periodoLabel}`, 14, 38)
    autoTable(doc, {
      startY: 44,
      head: [['Cortador', 'Órdenes', 'Total m²', 'Promedio m²/día']],
      body: [
        ...tablaResumen.map((c, i) => [`${i + 1}. ${c.nombre}`, c.ordenes, `${c.total} m²`, `${c.promedio} m²`]),
        ['TOTAL', tablaResumen.reduce((s, c) => s + c.ordenes, 0), `${totalPeriodo} m²`, ''],
      ],
      headStyles: { fillColor: [45, 74, 45], textColor: [212, 196, 160], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 246, 240] },
      styles: { fontSize: 11 },
    })
    const completadas = ordenes.filter(o => o.estado === 'completada' && o.metraje_producido)
    const finalY = doc.lastAutoTable.finalY + 12
    doc.setTextColor(45, 74, 45); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
    doc.text('Detalle de órdenes completadas', 14, finalY)
    autoTable(doc, {
      startY: finalY + 4,
      head: [['N° Orden', 'Cortador', 'Producto', 'Medidas', 'Fecha', 'm² Producidos']],
      body: completadas.map(o => [o.numero, o.cortador, o.producto, o.medidas, o.fecha, `${o.metraje_producido} m²`]),
      headStyles: { fillColor: [45, 74, 45], textColor: [212, 196, 160], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 246, 240] },
      styles: { fontSize: 9 },
    })
    doc.save(`productividad_${vistaInforme}_${fechaBase}.pdf`)
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const ordenesFiltradas = ordenes.filter(o => {
    const porCortador = filtroCortador === 'todos' || o.cortador === filtroCortador
    const porEstado   = filtroEstado   === 'todos' || o.estado   === filtroEstado
    return porCortador && porEstado
  })

  function cambiarEstado(id, estado) {
    if (estado === 'completada') {
      const orden = ordenes.find(o => o.id === id)
      setPedirMetraje({ id, metraje: orden.metraje_producido || '' })
      return
    }
    const actualizar = o => o.id === id ? { ...o, estado } : o
    setOrdenes(prev => [...prev.map(actualizar)])
    setSeleccionada(prev => prev ? actualizar(prev) : prev)
  }

  function confirmarCompletada() {
    if (!pedirMetraje) return
    const metraje    = parseFloat(pedirMetraje.metraje || 0)
    const actualizar = o => o.id === pedirMetraje.id
      ? { ...o, estado: 'completada', metraje_producido: metraje > 0 ? metraje : null }
      : o
    setOrdenes(prev => [...prev.map(actualizar)])
    setSeleccionada(prev => prev ? actualizar(prev) : prev)
    setPedirMetraje(null)
  }

  function abrirEditar(o) {
    setEditandoId(o.id)
    setForm({
      cliente: o.cliente, cotizacion: o.cotizacion || '', cortador: o.cortador,
      producto: o.producto, medidas: o.medidas, cantidad: o.cantidad, unidad: o.unidad,
      descripcion: o.descripcion || '', prioridad: o.prioridad, fecha: o.fecha,
      notas: o.notas || '', metraje_producido: o.metraje_producido || '',
    })
    setSeleccionada(null)
    setMostrarForm(true)
  }

  // ✅ FIX: spread para forzar nuevo array y re-render
  function eliminarOrden(id) {
    setOrdenes(prev => [...prev.filter(o => o.id !== id)])
    setSeleccionada(null)
    setConfirmarEliminar(null)
  }

  function guardarOrden() {
    if (!form.cliente || !form.producto) return
    if (editandoId) {
      const metraje     = parseFloat(form.metraje_producido || 0)
      const ordenActual = ordenes.find(o => o.id === editandoId)
      let nuevoEstado   = ordenActual.estado
      if (metraje > 0)                              nuevoEstado = 'completada'
      else if (ordenActual.estado === 'completada') nuevoEstado = 'en_proceso'
      setOrdenes(prev => [...prev.map(o =>
        o.id === editandoId
          ? { ...o, ...form, metraje_producido: metraje > 0 ? metraje : null, estado: nuevoEstado }
          : o
      )])
      setEditandoId(null)
    } else {
      setOrdenes(prev => [...prev, {
        ...form, id: Date.now(),
        numero: `COR-${String(ordenes.length + 1).padStart(4, '0')}`,
        estado: 'asignada', metraje_producido: null,
      }])
    }
    setMostrarForm(false)
    setForm(formVacio())
  }

  const conteo = {
    asignada:   ordenes.filter(o => o.estado === 'asignada').length,
    en_proceso: ordenes.filter(o => o.estado === 'en_proceso').length,
    completada: ordenes.filter(o => o.estado === 'completada').length,
    cancelada:  ordenes.filter(o => o.estado === 'cancelada').length,
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Órdenes de corte</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{ordenes.length} órdenes registradas</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMostrarProductividad(true)}
            style={{ backgroundColor: 'rgba(212,196,160,0.2)', color: '#D4C4A0', border: '1px solid rgba(212,196,160,0.4)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={15} /> Productividad
          </button>
          <button onClick={() => { setEditandoId(null); setForm(formVacio()); setMostrarForm(true) }}
            style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Nueva orden
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {Object.entries(estadoConfig).map(([key, val]) => (
            <div key={key} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{val.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: val.color }}>{conteo[key]}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['todos', ...cortadores].map(c => (
              <button key={c} onClick={() => setFiltroCortador(c)} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                border: filtroCortador === c ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                backgroundColor: filtroCortador === c ? '#2D4A2D' : '#fff',
                color: filtroCortador === c ? '#D4C4A0' : '#888',
                fontWeight: filtroCortador === c ? '600' : '400',
              }}>{c === 'todos' ? 'Todos' : c}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['todos', ...Object.keys(estadoConfig)].map(e => (
              <button key={e} onClick={() => setFiltroEstado(e)} style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                border: filtroEstado === e ? `1.5px solid ${e === 'todos' ? '#2D4A2D' : estadoConfig[e].color}` : '1px solid #e0d8c8',
                backgroundColor: filtroEstado === e ? (e === 'todos' ? '#2D4A2D' : estadoConfig[e].bg) : '#fff',
                color: filtroEstado === e ? (e === 'todos' ? '#D4C4A0' : estadoConfig[e].color) : '#888',
                fontWeight: filtroEstado === e ? '600' : '400',
              }}>{e === 'todos' ? 'Todos los estados' : estadoConfig[e].label}</button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ordenesFiltradas.map(o => {
            const est = estadoConfig[o.estado]
            return (
              <div key={o.id}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: `1px solid ${o.prioridad === 'urgente' ? '#f9a0a0' : '#e0d8c8'}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = o.prioridad === 'urgente' ? '#f9a0a0' : '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => setSeleccionada(o)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: est.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Scissors size={18} color={est.color} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{o.numero}</p>
                      {o.prioridad === 'urgente' && <span style={{ fontSize: '10px', backgroundColor: '#FCEBEB', color: '#A32D2D', padding: '1px 7px', borderRadius: '20px', fontWeight: '600' }}>URGENTE</span>}
                      {o.metraje_producido
                        ? <span style={{ fontSize: '10px', backgroundColor: '#EAF3DE', color: '#3B6D11', padding: '1px 7px', borderRadius: '20px', fontWeight: '600' }}>{o.metraje_producido} m²</span>
                        : (o.estado !== 'asignada' && o.estado !== 'cancelada')
                          ? <span style={{ fontSize: '10px', backgroundColor: '#FAEEDA', color: '#854F0B', padding: '1px 7px', borderRadius: '20px', fontWeight: '600' }}>Sin metraje</span>
                          : null
                      }
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{o.cliente} · {o.producto} · {o.medidas}</p>
                    <p style={{ fontSize: '12px', color: '#2D4A2D', marginTop: '2px', fontWeight: '500' }}>Cortador: {o.cortador} · {o.fecha}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', backgroundColor: est.bg, color: est.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{est.label}</span>
                  <button onClick={() => abrirEditar(o)} style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={14} color="#185FA5" />
                  </button>
                  <button onClick={() => setConfirmarEliminar(o)} style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#A32D2D" />
                  </button>
                </div>
              </div>
            )
          })}
          {ordenesFiltradas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              <Scissors size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>No hay órdenes de corte</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Productividad */}
      {mostrarProductividad && (
        <div onClick={() => setMostrarProductividad(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>Informe de productividad</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>Metraje producido por cortador</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={exportarPDF}
                  style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} /> Descargar PDF
                </button>
                <button onClick={() => setMostrarProductividad(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Controles */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[{ key: 'dia', label: 'Por día' }, { key: 'semana', label: 'Por semana' }, { key: 'mes', label: 'Por mes' }].map(v => (
                    <button key={v.key} onClick={() => setVistaInforme(v.key)} style={{
                      padding: '7px 16px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
                      border: vistaInforme === v.key ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                      backgroundColor: vistaInforme === v.key ? '#2D4A2D' : '#fff',
                      color: vistaInforme === v.key ? '#D4C4A0' : '#888',
                      fontWeight: vistaInforme === v.key ? '600' : '400',
                    }}>{v.label}</button>
                  ))}
                </div>
                <input type="date" value={fechaBase} onChange={e => setFechaBase(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
              </div>

              {/* Gráfica */}
              {datosInforme.length > 0 ? (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '12px', padding: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#2D4A2D', marginBottom: '14px' }}>
                    {vistaInforme === 'dia'    && `m² producidos el ${fechaBase}`}
                    {vistaInforme === 'semana' && 'Producción de los últimos 7 días por cortador'}
                    {vistaInforme === 'mes'    && 'Producción de las últimas 4 semanas por cortador'}
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    {vistaInforme === 'dia' ? (
                      <BarChart data={datosInforme} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" />
                        <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} unit=" m²" />
                        <Tooltip formatter={v => [`${v} m²`, 'Producido']} />
                        <Bar dataKey="total" fill="#2D4A2D" radius={[6, 6, 0, 0]} name="m² producidos" />
                      </BarChart>
                    ) : vistaInforme === 'semana' ? (
                      <LineChart data={datosInforme} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} unit=" m²" />
                        <Tooltip formatter={v => [`${v} m²`]} />
                        <Legend />
                        {cortadores.map((c, i) => (
                          <Line key={c} type="monotone" dataKey={c} stroke={COLORES_CORTADORES[i]} strokeWidth={2} dot={{ r: 4 }} />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart data={datosInforme} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" />
                        <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} unit=" m²" />
                        <Tooltip formatter={v => [`${v} m²`]} />
                        <Legend />
                        {cortadores.map((c, i) => (
                          <Bar key={c} dataKey={c} stackId="a" fill={COLORES_CORTADORES[i]} name={c} />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888', backgroundColor: '#f9f6f0', borderRadius: '12px' }}>
                  <BarChart2 size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p>No hay datos para este período</p>
                </div>
              )}

              {/* Tabla resumen */}
              {tablaResumen.length > 0 && (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#2D4A2D', marginBottom: '10px' }}>Resumen del período</p>
                  <div style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#2D4A2D' }}>
                          {['#', 'Cortador', 'Órdenes', 'Total m²', 'Promedio m²/día'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', color: '#D4C4A0', fontWeight: '600', textAlign: 'left', fontSize: '12px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tablaResumen.map((c, i) => (
                          <tr key={c.nombre} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f6f0', borderBottom: '1px solid #e0d8c8' }}>
                            <td style={{ padding: '10px 14px', color: '#888' }}>{i + 1}</td>
                            <td style={{ padding: '10px 14px', fontWeight: '600', color: '#2a2a2a' }}>{c.nombre}</td>
                            <td style={{ padding: '10px 14px', color: '#555' }}>{c.ordenes}</td>
                            <td style={{ padding: '10px 14px', fontWeight: '700', color: '#2D4A2D' }}>{c.total} m²</td>
                            <td style={{ padding: '10px 14px', color: '#555' }}>{c.promedio} m²</td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: '#2D4A2D' }}>
                          <td colSpan={3} style={{ padding: '10px 14px', color: '#D4C4A0', fontWeight: '600' }}>TOTAL DEL PERÍODO</td>
                          <td style={{ padding: '10px 14px', color: '#D4C4A0', fontWeight: '700', fontSize: '15px' }}>{totalPeriodo} m²</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal pedir metraje */}
      {pedirMetraje && (
        <div onClick={() => setPedirMetraje(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <CheckCircle size={26} color="#3B6D11" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#2a2a2a', marginBottom: '6px', textAlign: 'center' }}>Marcar como completada</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px', textAlign: 'center' }}>Ingresa el metraje real producido</p>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Metraje producido (m²)</p>
              <input type="number" min="0" step="0.1" placeholder="Ej: 14.5"
                value={pedirMetraje.metraje}
                onChange={e => setPedirMetraje(prev => ({ ...prev, metraje: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '14px', outline: 'none', textAlign: 'center', fontWeight: '600' }}
                autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPedirMetraje(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={confirmarCompletada} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#2D4A2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#D4C4A0' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div onClick={() => setConfirmarEliminar(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={24} color="#A32D2D" />
            </div>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#2a2a2a', marginBottom: '6px' }}>¿Eliminar orden?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
              Se eliminará <strong>{confirmarEliminar.numero}</strong> de {confirmarEliminar.cortador}. No se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
              <button onClick={() => eliminarOrden(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {seleccionada && (
        <div onClick={() => setSeleccionada(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionada.numero}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionada.cliente} · {seleccionada.fecha}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => abrirEditar(seleccionada)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={15} color="#D4C4A0" /></button>
                <button onClick={() => { setConfirmarEliminar(seleccionada); setSeleccionada(null) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={15} color="#f9a0a0" /></button>
                <button onClick={() => setSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Producto',           valor: seleccionada.producto },
                  { label: 'Medidas',             valor: seleccionada.medidas },
                  { label: 'Cantidad solicitada', valor: `${seleccionada.cantidad} ${seleccionada.unidad}` },
                  { label: 'Metraje producido',   valor: seleccionada.metraje_producido ? `${seleccionada.metraje_producido} m²` : 'Sin registrar' },
                  { label: 'Cortador',            valor: seleccionada.cortador },
                  { label: 'Cotización',          valor: seleccionada.cotizacion || '—' },
                  { label: 'Descripción',         valor: seleccionada.descripcion || '—' },
                ].map(({ label, valor }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{label}</span>
                    <span style={{ fontSize: '13px', color: label === 'Metraje producido' ? (seleccionada.metraje_producido ? '#3B6D11' : '#854F0B') : '#2a2a2a', fontWeight: '500', textAlign: 'right' }}>{valor}</span>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Estado de la orden</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(estadoConfig).map(([k, v]) => (
                    <button key={k} onClick={() => cambiarEstado(seleccionada.id, k)} style={{
                      padding: '10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                      border: seleccionada.estado === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8',
                      backgroundColor: seleccionada.estado === k ? v.bg : '#fff',
                      color: seleccionada.estado === k ? v.color : '#888',
                      fontWeight: seleccionada.estado === k ? '600' : '400',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                      {k === 'asignada'   && <Clock size={13} />}
                      {k === 'en_proceso' && <Scissors size={13} />}
                      {k === 'completada' && <CheckCircle size={13} />}
                      {k === 'cancelada'  && <AlertTriangle size={13} />}
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
              {seleccionada.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionada.notas}</p>
                </div>
              )}
              <button onClick={() => setSeleccionada(null)} style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                ✓ Aceptar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva/editar */}
      {mostrarForm && (
        <div onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar orden' : 'Nueva orden de corte'}</p>
              <button onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Cliente *</p>
                  <input type="text" placeholder="Nombre del cliente" value={form.cliente} onChange={e => setForm({ ...form, cliente: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>N° Cotización</p>
                  <input type="text" placeholder="Ej: COT-0001" value={form.cotizacion} onChange={e => setForm({ ...form, cotizacion: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Tipo de piedra *</p>
                <select value={form.producto} onChange={e => setForm({ ...form, producto: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                  <option value="">Selecciona el producto...</option>
                  {productosData.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Medidas</p>
                  <input type="text" placeholder="20x10 cm" value={form.medidas} onChange={e => setForm({ ...form, medidas: e.target.value })} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Cantidad</p>
                  <input type="number" min="1" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Unidad</p>
                  <select value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    <option>m²</option><option>ml</option><option>cm²</option><option>piezas</option>
                  </select>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Descripción del corte</p>
                <input type="text" placeholder="Ej: Corte recto, acabado liso..." value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
              </div>
              {editandoId && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '12px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>
                    Metraje producido (m²) <span style={{ fontSize: '11px', color: '#888', fontWeight: '400' }}>— 0 = no completado</span>
                  </p>
                  <input type="number" min="0" step="0.1" placeholder="0" value={form.metraje_producido} onChange={e => setForm({ ...form, metraje_producido: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                  <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>Valor {'>'} 0 → Completada · Valor = 0 → En proceso</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Asignar a cortador</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {cortadores.map(c => (
                    <button key={c} onClick={() => setForm({ ...form, cortador: c })} style={{
                      padding: '7px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: form.cortador === c ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                      backgroundColor: form.cortador === c ? '#2D4A2D' : '#fff',
                      color: form.cortador === c ? '#D4C4A0' : '#888',
                      fontWeight: form.cortador === c ? '600' : '400',
                    }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Prioridad</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[{ key: 'normal', label: 'Normal', color: '#3B6D11', bg: '#EAF3DE' }, { key: 'urgente', label: 'Urgente', color: '#A32D2D', bg: '#FCEBEB' }].map(p => (
                      <button key={p.key} onClick={() => setForm({ ...form, prioridad: p.key })} style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', border: form.prioridad === p.key ? `1.5px solid ${p.color}` : '1px solid #e0d8c8', backgroundColor: form.prioridad === p.key ? p.bg : '#fff', color: form.prioridad === p.key ? p.color : '#888', fontWeight: form.prioridad === p.key ? '600' : '400' }}>{p.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Fecha</p>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Instrucciones especiales..." rows={3} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <button onClick={guardarOrden} style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {editandoId ? 'Guardar cambios' : 'Crear orden de corte'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
