import { useState } from 'react'
import { Plus, X, FileText, Trash2, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Datos fijos de la empresa ─────────────────────────────────────────────────
const EMPRESA = {
  razon_social: 'Félix Mendoza Ochante',
  ruc:          '10091300775',
  direccion:    'Jr. Flor Iris Sn Asc. de Servicios Múltiples SA Int. 23 Alt. Comisaría Pamplona 1, San Juan de Miraflores - Lima - Lima',
  telefono:     '952739105',
  bcp_cuenta:   '19493170245057',
  bcp_cci:      '00219419317024505793',
  bbva_cuenta:  '00110814-0279182672-16',
  bbva_cci:     '011-814-0000279182672-16',
  nombre_titular: 'Félix Mendoza Ochante',
  validez_dias: 15,
  condiciones: [
    'La presente cotización tiene una validez de 15 días.',
    'Los precios no incluyen IGV.',
    'Forma de pago: A convenir.',
    'Tiempo estimado de ejecución: Según programación acordada.',
  ],
}

const estadoConfig = {
  borrador:  { label: 'Borrador',  color: '#5F5E5A', bg: '#F1EFE8' },
  enviada:   { label: 'Enviada',   color: '#185FA5', bg: '#E6F1FB' },
  aceptada:  { label: 'Aceptada',  color: '#3B6D11', bg: '#EAF3DE' },
  rechazada: { label: 'Rechazada', color: '#A32D2D', bg: '#FCEBEB' },
}

const tipoItemColor = { material: '#2D4A2D', corte: '#854F0B', flete: '#185FA5', instalacion: '#5F5E5A' }
const tipoItemLabel = { material: 'Material', corte: 'Corte', flete: 'Flete', instalacion: 'Instalación' }

const itemVacio = () => ({
  id: Date.now() + Math.random(),
  tipo: 'material', descripcion: '', formato: '',
  cantidad: 1, unidad: 'm²', precio_unit: 0, subtotal: 0,
})

function calcularSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
}

function calcularTotal(items, conIgv) {
  const sub = calcularSubtotal(items)
  return conIgv ? sub * 1.18 : sub
}

// ── Generador de PDF ──────────────────────────────────────────────────────────
function generarPDF(cot) {
  const doc = new jsPDF()
  const sub  = calcularSubtotal(cot.items || [])
  const total = cot.total || 0

  // Título
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`COTIZACIÓN N.° ${cot.numero}`, 105, 18, { align: 'center' })

  // Fecha
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha: ${cot.fecha}`, 14, 28)

  // Datos empresa
  doc.setFontSize(10)
  doc.text(`Razón Social: ${EMPRESA.razon_social}`, 14, 36)
  doc.text(`RUC: ${EMPRESA.ruc}`, 14, 42)
  const dirLines = doc.splitTextToSize(`Dirección: ${EMPRESA.direccion}`, 180)
  doc.text(dirLines, 14, 48)
  const yDespuesDireccion = 48 + dirLines.length * 5

  // Datos cliente
  doc.setFont('helvetica', 'bold')
  doc.text(`Cliente: ${cot.cliente_nombre || ''}`, 14, yDespuesDireccion + 6)
  if (cot.cliente_documento) {
    doc.setFont('helvetica', 'normal')
    doc.text(`${cot.cliente_tipo_doc || 'DNI'}: ${cot.cliente_documento}`, 14, yDespuesDireccion + 12)
  }

  const yTabla = yDespuesDireccion + (cot.cliente_documento ? 20 : 16)

  // Título tabla
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Detalle de la Cotización', 14, yTabla)

  // Tabla de ítems
  autoTable(doc, {
    startY: yTabla + 4,
    head: [['Producto', 'Formato / Tipo', 'Cantidad\n(m²)', 'Precio Metro Cuadrado\n(S/)', 'Subtotal\n(S/)']],
    body: (cot.items || []).map(item => [
      item.descripcion || '',
      item.formato     || item.tipo,
      item.cantidad,
      parseFloat(item.precio_unit || 0).toFixed(2),
      parseFloat(item.subtotal    || 0).toFixed(2),
    ]),
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      halign: 'center',
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [0, 0, 0],
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'left',  cellWidth: 45 },
      1: { halign: 'center', cellWidth: 55 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 35 },
      4: { halign: 'center', cellWidth: 30 },
    },
    styles: { fontSize: 10 },
  })

  let yPos = doc.lastAutoTable.finalY + 8

  // Total
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const textoTotal = cot.igv
    ? `Incluye IGV (18%), total a Pagar: S/ ${total.toFixed(2)}`
    : `No incluye IGV, total a Pagar: S/ ${total.toFixed(2)}`
  doc.text(textoTotal, 195, yPos, { align: 'right' })
  yPos += 10

  // Condiciones
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Condiciones', 14, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  EMPRESA.condiciones.forEach(cond => {
    doc.text(`  - ${cond}`, 14, yPos)
    yPos += 5
  })

  // Notas adicionales
  if (cot.notas) {
    yPos += 3
    doc.setFont('helvetica', 'bold')
    doc.text('Observaciones:', 14, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    const notaLines = doc.splitTextToSize(cot.notas, 180)
    doc.text(notaLines, 14, yPos)
    yPos += notaLines.length * 5
  }

  // Firma
  yPos += 10
  doc.text('Atentamente,', 14, yPos)
  yPos += 14
  doc.line(14, yPos, 80, yPos)
  yPos += 5
  doc.text(`${EMPRESA.razon_social} - RUC ${EMPRESA.ruc}`, 14, yPos)

  // Pie de página con datos bancarios
  const yPie = 272
  doc.setDrawColor(0)
  doc.line(14, yPie - 4, 196, yPie - 4)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Teléfono: ${EMPRESA.telefono}`, 14, yPie)

  doc.setFont('helvetica', 'normal')
  doc.text(`CTA BCP: ${EMPRESA.bcp_cuenta}`, 14, yPie + 5)
  doc.text(`CCI: ${EMPRESA.bcp_cci}`, 80, yPie + 5)
  doc.text(EMPRESA.nombre_titular, 160, yPie + 5)

  doc.text(`CTA BBVA: ${EMPRESA.bbva_cuenta}`, 14, yPie + 10)
  doc.text(`CCI: ${EMPRESA.bbva_cci}`, 80, yPie + 10)
  doc.text(EMPRESA.nombre_titular, 160, yPie + 10)

  doc.save(`cotizacion_${cot.numero}_${cot.cliente_nombre?.replace(/ /g, '_') || 'cliente'}.pdf`)
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Cotizaciones() {
  const { cotizaciones, setCotizaciones, clientes, productos } = useApp()

  const [mostrarForm, setMostrarForm]             = useState(false)
  const [seleccionada, setSeleccionada]           = useState(null)
  const [editandoId, setEditandoId]               = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [form, setForm] = useState({
    cliente_id: '', cliente_nombre: '', cliente_documento: '', cliente_tipo_doc: 'DNI',
    cliente_direccion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'borrador', items: [itemVacio()], notas: '', igv: false,
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

  function guardarCotizacion() {
    if (!form.cliente_nombre) return
    const total = calcularTotal(form.items, form.igv)
    if (editandoId) {
      setCotizaciones(prev => [...prev.map(c =>
        c.id === editandoId ? { ...c, ...form, total } : c
      )])
      setEditandoId(null)
    } else {
      const numero = `COT-${String(cotizaciones.length + 1).padStart(4, '0')}`
      setCotizaciones(prev => [...prev, { ...form, id: Date.now(), numero, total }])
    }
    setMostrarForm(false)
    resetForm()
  }

  function resetForm() {
    setForm({
      cliente_id: '', cliente_nombre: '', cliente_documento: '', cliente_tipo_doc: 'DNI',
      cliente_direccion: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'borrador', items: [itemVacio()], notas: '', igv: false,
    })
  }

  function abrirEditar(c) {
    setEditandoId(c.id)
    setForm({
      cliente_id:        c.cliente_id        || '',
      cliente_nombre:    c.cliente_nombre    || '',
      cliente_documento: c.cliente_documento || '',
      cliente_tipo_doc:  c.cliente_tipo_doc  || 'DNI',
      cliente_direccion: c.cliente_direccion || '',
      fecha:             c.fecha,
      estado:            c.estado,
      items:             c.items,
      notas:             c.notas             || '',
      igv:               c.igv               || false,
    })
    setSeleccionada(null)
    setMostrarForm(true)
  }

  function eliminarCotizacion(id) {
    setCotizaciones(prev => [...prev.filter(c => c.id !== id)])
    setSeleccionada(null)
    setConfirmarEliminar(null)
  }

  // Al seleccionar cliente del dropdown, autocompletar datos
  function seleccionarCliente(clienteId) {
    const c = clientes.find(c => c.id === parseInt(clienteId))
    if (c) {
      setForm(prev => ({
        ...prev,
        cliente_id:        clienteId,
        cliente_nombre:    c.nombre,
        cliente_documento: c.documento || '',
        cliente_tipo_doc:  c.tipo      || 'DNI',
        cliente_direccion: c.direccion || '',
      }))
    } else {
      setForm(prev => ({ ...prev, cliente_id: clienteId }))
    }
  }

  const productosNombres = productos.map(p => p.nombre)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Cotizaciones</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{cotizaciones.length} cotizaciones registradas</p>
        </div>
        <button onClick={() => { setEditandoId(null); resetForm(); setMostrarForm(true) }}
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
          {cotizaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8' }}>
              <FileText size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
              <p>No hay cotizaciones aún</p>
            </div>
          ) : cotizaciones.map(c => {
            const est = estadoConfig[c.estado]
            return (
              <div key={c.id}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => setSeleccionada(c)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={18} color="#3B6D11" />
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{c.numero}</p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.cliente_nombre} · {c.fecha}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {c.igv && <span style={{ fontSize: '10px', backgroundColor: '#E6F1FB', color: '#185FA5', padding: '2px 7px', borderRadius: '20px', fontWeight: '600' }}>+IGV</span>}
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#2D4A2D' }}>S/ {(c.total || 0).toFixed(2)}</p>
                  <span style={{ fontSize: '11px', backgroundColor: est.bg, color: est.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{est.label}</span>
                  {/* Botón descargar PDF */}
                  <button onClick={e => { e.stopPropagation(); generarPDF(c) }}
                    style={{ background: '#EAF3DE', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    title="Descargar PDF">
                    <Download size={14} color="#3B6D11" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); abrirEditar(c) }}
                    style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <FileText size={14} color="#185FA5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setConfirmarEliminar(c) }}
                    style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={14} color="#A32D2D" />
                  </button>
                </div>
              </div>
            )
          })}
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => generarPDF(seleccionada)}
                  style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Download size={13} /> PDF
                </button>
                <button onClick={() => setSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>

              {/* Info cliente */}
              {(seleccionada.cliente_documento || seleccionada.cliente_direccion) && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                  {seleccionada.cliente_documento && <p style={{ fontSize: '12px', color: '#555' }}><strong>{seleccionada.cliente_tipo_doc}:</strong> {seleccionada.cliente_documento}</p>}
                  {seleccionada.cliente_direccion && <p style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}><strong>Dirección:</strong> {seleccionada.cliente_direccion}</p>}
                </div>
              )}

              <p style={{ fontSize: '12px', fontWeight: '600', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detalle</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {seleccionada.items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f9f6f0', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', backgroundColor: '#fff', color: tipoItemColor[item.tipo], border: `1px solid ${tipoItemColor[item.tipo]}`, padding: '1px 7px', borderRadius: '20px', fontWeight: '600', marginRight: '8px' }}>
                        {tipoItemLabel[item.tipo]}
                      </span>
                      <span style={{ fontSize: '13px', color: '#2a2a2a' }}>{item.descripcion}</span>
                      {item.formato && <span style={{ fontSize: '12px', color: '#888' }}> · {item.formato}</span>}
                      <p style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>{item.cantidad} {item.unidad} × S/ {item.precio_unit}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>S/ {(item.subtotal || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ borderTop: '2px solid #e0d8c8', paddingTop: '12px', marginBottom: '16px' }}>
                {seleccionada.igv && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>Subtotal</span>
                      <span style={{ fontSize: '13px', color: '#555' }}>S/ {calcularSubtotal(seleccionada.items || []).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#888' }}>IGV (18%)</span>
                      <span style={{ fontSize: '13px', color: '#555' }}>S/ {(calcularSubtotal(seleccionada.items || []) * 0.18).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#2a2a2a' }}>Total {seleccionada.igv ? '(inc. IGV)' : ''}</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#2D4A2D' }}>S/ {(seleccionada.total || 0).toFixed(2)}</p>
                </div>
              </div>

              {seleccionada.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionada.notas}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => abrirEditar(seleccionada)}
                  style={{ flex: 1, backgroundColor: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={() => generarPDF(seleccionada)}
                  style={{ flex: 1, backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Download size={14} /> Descargar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div onClick={() => setConfirmarEliminar(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={32} color="#A32D2D" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>¿Eliminar cotización?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará <strong>{confirmarEliminar.numero}</strong>. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => eliminarCotizacion(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva / editar cotización */}
      {mostrarForm && (
        <div onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar cotización' : 'Nueva cotización'}</p>
              <button onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Datos del cliente */}
              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#2D4A2D', marginBottom: '2px' }}>Datos del cliente</p>

                {/* Selector de cliente registrado */}
                {clientes.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Seleccionar cliente registrado (opcional)</p>
                    <select value={form.cliente_id} onChange={e => seleccionarCliente(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                      <option value="">— Ingresar manualmente —</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Nombre completo / Razón social *</p>
                  <input type="text" placeholder="Ej: Juan Andrés Calderón Estrada" value={form.cliente_nombre}
                    onChange={e => setForm({ ...form, cliente_nombre: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Tipo doc.</p>
                    <select value={form.cliente_tipo_doc} onChange={e => setForm({ ...form, cliente_tipo_doc: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                      <option>DNI</option><option>RUC</option><option>CE</option>
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Número de documento</p>
                    <input type="text" placeholder="Ej: 10720519" value={form.cliente_documento}
                      onChange={e => setForm({ ...form, cliente_documento: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Dirección del cliente (opcional)</p>
                  <input type="text" placeholder="Ej: Av. Los Olivos 234, Lima" value={form.cliente_direccion}
                    onChange={e => setForm({ ...form, cliente_direccion: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
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
                  <button onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, itemVacio()] }))}
                    style={{ fontSize: '12px', color: '#2D4A2D', background: 'none', border: '1px solid #2D4A2D', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          <button onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D' }}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      {/* Producto */}
                      {item.tipo === 'material' ? (
                        <select value={item.descripcion} onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff', marginBottom: '8px' }}>
                          <option value="">Selecciona producto...</option>
                          {productosNombres.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <input type="text" placeholder="Descripción del servicio..." value={item.descripcion}
                          onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />
                      )}

                      {/* Formato / Tipo */}
                      <input type="text" placeholder="Formato / Tipo (Ej: Formato 20x10, Retazo irregular...)" value={item.formato || ''}
                        onChange={e => actualizarItem(item.id, 'formato', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />

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
                            <option>m²</option><option>ml</option><option>cm²</option><option>servicio</option><option>unidad</option>
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
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D4A2D' }}>Subtotal: S/ {(item.subtotal || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total con IGV */}
                <div style={{ marginTop: '12px', backgroundColor: '#2D4A2D', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#a0b89a', fontSize: '13px' }}>Incluir IGV (18%)</span>
                    <div onClick={() => setForm(prev => ({ ...prev, igv: !prev.igv }))}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', backgroundColor: form.igv ? '#D4C4A0' : 'rgba(255,255,255,0.2)', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: '3px', left: form.igv ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: form.igv ? '#2D4A2D' : '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>
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
                    <span style={{ color: '#D4C4A0', fontSize: '14px', fontWeight: '600' }}>Total {form.igv ? '(inc. IGV)' : ''}</span>
                    <span style={{ color: '#D4C4A0', fontSize: '18px', fontWeight: '700' }}>S/ {calcularTotal(form.items, form.igv).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas / Condiciones adicionales</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones, condiciones especiales de entrega..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <button onClick={guardarCotizacion}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {editandoId ? 'Guardar cambios' : 'Guardar cotización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
