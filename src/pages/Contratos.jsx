import { useState, useRef, useEffect } from 'react'
import { Plus, X, FileText, Trash2, Download, Edit2, PenTool, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Empresa ───────────────────────────────────────────────────────────────────
const EMPRESA = {
  nombre_comercial: 'Decoraciones Gallito y Piedra',
  razon_social:     'Félix Mendoza Ochante',
  ruc:              '10091300775',
  direccion:        'Jr. Flor Iris Sn Asc. de Servicios Múltiples SA Int. 23 Alt. Comisaría Pamplona 1, San Juan de Miraflores - Lima - Lima',
  telefono:         '952739105',
  dni:              '091300775',
}

// ── FIRMA DEL PROVEEDOR (importada desde src/assets/firmaFelix.js) ─────────────
// Fallback vacío — la firma real viene del archivo firmaFelix.js
let FIRMA_FELIX = null
try {
  // Se importa dinámicamente para evitar errores si el archivo no existe aún
  import('../assets/firmaFelix.js').then(m => { FIRMA_FELIX = m.FIRMA_FELIX }).catch(() => {})
} catch {}

const VERDE       = [45, 74, 45]
const VERDE_CLARO = [74, 124, 89]
const BEIGE       = [212, 196, 160]
const BEIGE_FONDO = [245, 240, 232]
const GRIS        = [80, 80, 80]
const NEGRO       = [30, 30, 30]
const BLANCO      = [255, 255, 255]

// ── Generador PDF Contrato ────────────────────────────────────────────────────
async function generarPDFContrato(contrato) {
  const doc = new jsPDF()
  const W   = 210
  const hoy = new Date(contrato.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })

  // Encabezado
  doc.setFillColor(...VERDE); doc.rect(0, 0, W, 35, 'F')
  doc.setFillColor(...BEIGE); doc.rect(0, 35, W, 2, 'F')
  doc.setTextColor(...BEIGE); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text(EMPRESA.nombre_comercial.toUpperCase(), W / 2, 13, { align: 'center' })
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(`RUC: ${EMPRESA.ruc}  |  Telf: ${EMPRESA.telefono}`, W / 2, 21, { align: 'center' })
  doc.text(doc.splitTextToSize(EMPRESA.direccion, 160)[0], W / 2, 27, { align: 'center' })

  // Título
  doc.setFillColor(...BEIGE_FONDO); doc.rect(0, 37, W, 16, 'F')
  doc.setTextColor(...VERDE); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  const tipoLabel = contrato.tipo === 'venta' ? 'CONTRATO DE VENTA DE MATERIAL' : 'CONTRATO DE SERVICIO'
  doc.text(tipoLabel, W / 2, 46, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text(`N.° ${contrato.numero}  ·  ${hoy}`, W / 2, 52, { align: 'center' })

  let y = 60

  // Partes
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text('PARTES CONTRATANTES', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.3); doc.line(14, y, W - 14, y); y += 5

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NEGRO)
  doc.text('EL PROVEEDOR:', 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text(`${EMPRESA.razon_social}, identificado con DNI N.° ${EMPRESA.dni}, RUC ${EMPRESA.ruc},`, 14, y); y += 5
  const dirLines = doc.splitTextToSize(EMPRESA.direccion, W - 28)
  doc.text(`con domicilio en ${dirLines[0]}`, 14, y); y += 5
  doc.text(`en adelante denominado "EL PROVEEDOR".`, 14, y); y += 8

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...NEGRO)
  doc.text('EL CLIENTE / REPRESENTANTE LEGAL:', 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  const docCliente = contrato.cliente_documento ? `, identificado con ${contrato.cliente_tipo_doc || 'DNI'} N.° ${contrato.cliente_documento}` : ''
  doc.text(`${contrato.cliente_nombre}${docCliente},`, 14, y); y += 5
  if (contrato.cliente_direccion) { doc.text(`con domicilio en ${contrato.cliente_direccion},`, 14, y); y += 5 }
  doc.text(`en adelante denominado "EL CLIENTE".`, 14, y); y += 10

  // Objeto
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('PRIMERA: OBJETO DEL CONTRATO', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
  const textoObjeto = contrato.tipo === 'venta'
    ? `EL PROVEEDOR se compromete a suministrar y entregar a EL CLIENTE los materiales de laja y piedra natural detallados en el presente contrato, en las cantidades, especificaciones y condiciones acordadas.`
    : `EL PROVEEDOR se compromete a prestar el servicio de ${contrato.descripcion_servicio || 'corte e instalación de laja y piedra natural'} a EL CLIENTE, conforme a las especificaciones técnicas acordadas en el presente contrato.`
  const lineasObjeto = doc.splitTextToSize(textoObjeto, W - 28)
  doc.text(lineasObjeto, 14, y); y += lineasObjeto.length * 5 + 5

  // Tabla
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('SEGUNDA: DESCRIPCIÓN Y PRECIO', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 3

  const tableWidth = W - 28
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, tableWidth,
    head: [['Descripción', 'Cantidad', 'Unidad', 'Precio Unit. (S/)', 'Subtotal (S/)']],
    body: (contrato.items || []).map(item => [
      item.descripcion || '', item.cantidad || '',
      item.unidad || 'm²',
      parseFloat(item.precio_unit || 0).toFixed(2),
      parseFloat(item.subtotal    || 0).toFixed(2),
    ]),
    headStyles: { fillColor: VERDE_CLARO, textColor: BLANCO, fontStyle: 'bold', halign: 'center', fontSize: 8 },
    bodyStyles: { textColor: NEGRO, fontSize: 8, lineColor: [220, 210, 195], lineWidth: 0.3 },
    alternateRowStyles: { fillColor: BEIGE_FONDO },
    columnStyles: {
      0: { halign: 'left',   cellWidth: Math.round(tableWidth * 0.35) },
      1: { halign: 'center', cellWidth: Math.round(tableWidth * 0.12) },
      2: { halign: 'center', cellWidth: Math.round(tableWidth * 0.12) },
      3: { halign: 'center', cellWidth: Math.round(tableWidth * 0.20) },
      4: { halign: 'center', cellWidth: Math.round(tableWidth * 0.21) },
    },
    tableLineColor: [200, 190, 175], tableLineWidth: 0.3,
  })

  y = doc.lastAutoTable.finalY + 3
  const cajaX = 14 + tableWidth - 75
  doc.setFillColor(...VERDE); doc.rect(cajaX, y, 75, 10, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BEIGE)
  doc.text('MONTO TOTAL:', cajaX + 4, y + 7)
  doc.text(`S/ ${parseFloat(contrato.total || 0).toFixed(2)}`, cajaX + 71, y + 7, { align: 'right' })
  y += 14

  // Condiciones pago
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('TERCERA: CONDICIONES DE PAGO', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
  const condPago = contrato.condiciones_pago || 'Adelanto del 50% al inicio y saldo contra entrega del material.'
  const lineasPago = doc.splitTextToSize(condPago, W - 28)
  doc.text(lineasPago, 14, y); y += lineasPago.length * 5 + 3
  if (contrato.adelanto > 0) {
    doc.text(`• Adelanto pactado: S/ ${parseFloat(contrato.adelanto || 0).toFixed(2)}`, 14, y); y += 5
    doc.text(`• Saldo pendiente: S/ ${(parseFloat(contrato.total || 0) - parseFloat(contrato.adelanto || 0)).toFixed(2)}`, 14, y); y += 5
  }
  y += 3

  // Entrega
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('CUARTA: PLAZO Y LUGAR DE ENTREGA', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
  const modoEntrega = contrato.modo_entrega === 'obra' ? 'en obra del cliente' : contrato.modo_entrega === 'almacen' ? 'recojo en almacén del proveedor' : 'según lo acordado entre las partes'
  doc.text(`La entrega se realizará ${modoEntrega}.`, 14, y); y += 5
  doc.text(`Plazo de entrega: ${contrato.plazo_entrega || 'Según programación acordada'}.`, 14, y); y += 8

  // Especificaciones técnicas — NUEVA CLÁUSULA
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('QUINTA: ESPECIFICACIONES DEL MATERIAL', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
  const especificaciones = [
    'El espesor del material varía de 2.5 cm a 4.5 cm según el tipo de piedra.',
    'Los materiales son de origen natural extraídos de canteras del sur del Perú.',
    'Las dimensiones pueden variar ligeramente por tratarse de material natural.',
  ]
  especificaciones.forEach(e => { doc.text(`• ${e}`, 14, y); y += 5 })
  y += 3

  // Obligaciones — SIN las cláusulas eliminadas
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('SEXTA: OBLIGACIONES DE LAS PARTES', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
  const obligaciones = [
    'EL CLIENTE se compromete a efectuar los pagos en las fechas acordadas.',
    'El incumplimiento del pago dará lugar a la suspensión del suministro.',
    'Cualquier reclamo deberá ser comunicado dentro de los 3 días de recibido el material.',
  ]
  obligaciones.forEach(o => { doc.text(`• ${o}`, 14, y); y += 5 })
  y += 3

  // Notas
  if (contrato.notas) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
    doc.text('SÉTIMA: OBSERVACIONES', 14, y); y += 6
    doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS)
    const lineasNotas = doc.splitTextToSize(contrato.notas, W - 28)
    doc.text(lineasNotas, 14, y); y += lineasNotas.length * 5 + 5
  }

  // ── FIRMAS ────────────────────────────────────────────────────────────────
  y += 5
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...VERDE)
  doc.text('FIRMAS DE CONFORMIDAD', 14, y); y += 6
  doc.setDrawColor(...VERDE); doc.line(14, y, W - 14, y); y += 8
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GRIS)
  doc.text(`Lima, ${hoy}`, 14, y); y += 10

  const firmaProvX    = 20
  const firmaClienteX = W / 2 + 10
  const firmaAncho    = 65
  const firmaAlto     = 28

  // Firma proveedor — usar la de Félix si existe, si no la del contrato
  const firmaProveedorFinal = contrato.firma_proveedor || FIRMA_FELIX
  if (firmaProveedorFinal) {
    try {
      doc.addImage(firmaProveedorFinal, 'JPEG', firmaProvX, y, firmaAncho, firmaAlto)
    } catch (e) {
      try { doc.addImage(firmaProveedorFinal, 'PNG', firmaProvX, y, firmaAncho, firmaAlto) } catch {}
    }
  }

  // Firma cliente — si existe la dibuja, si no deja espacio en blanco
  if (contrato.firma_cliente) {
    try {
      doc.addImage(contrato.firma_cliente, 'PNG', firmaClienteX, y, firmaAncho, firmaAlto)
    } catch {}
  } else {
    // Espacio en blanco para firma manual del representante legal
    doc.setFillColor(252, 252, 252)
    doc.rect(firmaClienteX, y, firmaAncho, firmaAlto, 'F')
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3)
    doc.rect(firmaClienteX, y, firmaAncho, firmaAlto, 'S')
    doc.setFontSize(7); doc.setTextColor(160, 160, 160)
    doc.text('Firma del representante legal', firmaClienteX + firmaAncho / 2, y + firmaAlto / 2, { align: 'center' })
  }

  y += firmaAlto + 3

  // Líneas y nombres
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.4)
  doc.line(firmaProvX, y, firmaProvX + 70, y)
  doc.line(firmaClienteX, y, firmaClienteX + 70, y)
  y += 5
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...VERDE)
  doc.text('EL PROVEEDOR', firmaProvX, y)
  doc.text('EL CLIENTE / REPRESENTANTE LEGAL', firmaClienteX, y)
  y += 5
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text(EMPRESA.razon_social, firmaProvX, y)
  doc.text(contrato.cliente_nombre || '', firmaClienteX, y)
  y += 4
  doc.text(`DNI: ${EMPRESA.dni}`, firmaProvX, y)
  if (contrato.cliente_documento) doc.text(`${contrato.cliente_tipo_doc || 'DNI'}: ${contrato.cliente_documento}`, firmaClienteX, y)
  y += 4
  doc.text('Contratista', firmaProvX, y)

  // Pie
  const yPie = 285
  doc.setFillColor(...VERDE); doc.rect(0, yPie, W, 12, 'F')
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...BEIGE)
  doc.text(`${EMPRESA.nombre_comercial}  ·  RUC ${EMPRESA.ruc}  ·  Telf: ${EMPRESA.telefono}`, W / 2, yPie + 8, { align: 'center' })

  doc.save(`contrato_${contrato.numero}.pdf`)
}

// ── Canvas Firma ──────────────────────────────────────────────────────────────
function CanvasFirma({ onGuardar, onCancelar, titulo }) {
  const canvasRef = useRef(null)
  const dibujando = useRef(false)
  const [tieneFirma, setTieneFirma] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  function iniciar(e) { e.preventDefault(); dibujando.current = true; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  function dibujar(e) { e.preventDefault(); if (!dibujando.current) return; const p = getPos(e, canvasRef.current); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(p.x, p.y); ctx.stroke(); setTieneFirma(true) }
  function terminar(e) { e.preventDefault(); dibujando.current = false }
  function limpiar() { const ctx = canvasRef.current.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); setTieneFirma(false) }
  function guardar() { if (!tieneFirma) return; onGuardar(canvasRef.current.toDataURL('image/png')) }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
        <div style={{ backgroundColor: '#2D4A2D', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>{titulo}</p>
          <button onClick={onCancelar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '10px', textAlign: 'center' }}>Dibuja tu firma en el recuadro</p>
          <div style={{ border: '2px solid #2D4A2D', borderRadius: '8px', overflow: 'hidden', touchAction: 'none' }}>
            <canvas ref={canvasRef} width={440} height={160}
              style={{ display: 'block', width: '100%', cursor: 'crosshair', backgroundColor: '#fff' }}
              onMouseDown={iniciar} onMouseMove={dibujar} onMouseUp={terminar} onMouseLeave={terminar}
              onTouchStart={iniciar} onTouchMove={dibujar} onTouchEnd={terminar} />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button onClick={limpiar} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#888' }}>Limpiar</button>
            <button onClick={onCancelar} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer', color: '#555' }}>Cancelar</button>
            <button onClick={guardar} disabled={!tieneFirma} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: tieneFirma ? '#2D4A2D' : '#ccc', fontSize: '13px', fontWeight: '600', cursor: tieneFirma ? 'pointer' : 'not-allowed', color: '#D4C4A0' }}>
              <Check size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Guardar firma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Configs ───────────────────────────────────────────────────────────────────
const tipoConfig = {
  venta:    { label: 'Venta de material', color: '#2D4A2D', bg: '#EAF3DE' },
  servicio: { label: 'Servicio',          color: '#185FA5', bg: '#E6F1FB' },
}
const estadoConfig = {
  borrador:  { label: 'Borrador',  color: '#5F5E5A', bg: '#F1EFE8' },
  enviado:   { label: 'Enviado',   color: '#185FA5', bg: '#E6F1FB' },
  firmado:   { label: 'Firmado',   color: '#3B6D11', bg: '#EAF3DE' },
  cancelado: { label: 'Cancelado', color: '#A32D2D', bg: '#FCEBEB' },
}
const itemVacio = () => ({ id: Date.now() + Math.random(), descripcion: '', cantidad: 1, unidad: 'm²', precio_unit: 0, subtotal: 0 })
const formInicial = () => ({
  tipo: 'venta',
  cliente_nombre: '', cliente_documento: '', cliente_tipo_doc: 'DNI', cliente_direccion: '',
  fecha: new Date().toISOString().split('T')[0],
  estado: 'borrador', items: [itemVacio()], total: 0, adelanto: 0,
  condiciones_pago: 'Adelanto del 50% al inicio y saldo contra entrega del material.',
  modo_entrega: 'obra', plazo_entrega: 'Según programación acordada',
  descripcion_servicio: '', notas: '',
  firma_proveedor: null, firma_cliente: null,
  origen: null, origen_numero: '',
})

// ── Componente principal ──────────────────────────────────────────────────────
export default function Contratos() {
  const { contratos = [], agregarContrato, actualizarContrato, eliminarContrato, cotizaciones, ventas } = useApp()

  const [mostrarForm, setMostrarForm]             = useState(false)
  const [seleccionado, setSeleccionado]           = useState(null)
  const [editandoId, setEditandoId]               = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [guardando, setGuardando]                 = useState(false)
  const [firmaActiva, setFirmaActiva]             = useState(null)
  const [form, setForm]                           = useState(formInicial())
  const [origenModal, setOrigenModal]             = useState(false)

  function actualizarItem(id, campo, valor) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item
        const u = { ...item, [campo]: valor }
        if (campo === 'cantidad' || campo === 'precio_unit')
          u.subtotal = parseFloat(u.cantidad || 0) * parseFloat(u.precio_unit || 0)
        return u
      })
    }))
  }

  function calcularTotal() { return form.items.reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0) }

  function desdeOrigenCotizacion(cot) {
    const itemsConId = (cot.items || [itemVacio()]).map(item => ({ ...item, id: item.id || Date.now() + Math.random() }))
    setForm(prev => ({ ...prev, tipo: 'venta', cliente_nombre: cot.cliente_nombre || '', cliente_documento: cot.cliente_documento || '', cliente_tipo_doc: cot.cliente_tipo_doc || 'DNI', cliente_direccion: cot.cliente_direccion || '', items: itemsConId, total: cot.total || 0, origen: 'cotizacion', origen_numero: cot.numero, notas: `Generado desde cotización ${cot.numero}` }))
    setOrigenModal(false); setMostrarForm(true)
  }

  function desdeOrigenVenta(venta) {
    setForm(prev => ({ ...prev, tipo: 'venta', cliente_nombre: venta.cliente_nombre || '', items: [{ id: Date.now(), descripcion: venta.notas || 'Venta de material', cantidad: 1, unidad: 'global', precio_unit: venta.total || 0, subtotal: venta.total || 0 }], total: venta.total || 0, adelanto: venta.adelanto || 0, origen: 'venta', origen_numero: venta.numero, notas: `Generado desde venta ${venta.numero}` }))
    setOrigenModal(false); setMostrarForm(true)
  }

  function abrirEditar(c) {
    setEditandoId(c.id)
    const itemsConId = (c.items || [itemVacio()]).map(i => ({ ...i, id: i.id || Date.now() + Math.random() }))
    setForm({ ...c, items: itemsConId })
    setSeleccionado(null); setMostrarForm(true)
  }

  async function handleEliminar(id) {
    await eliminarContrato(id); setSeleccionado(null); setConfirmarEliminar(null)
  }

  async function guardar() {
    if (!form.cliente_nombre) return
    const total = calcularTotal()
    const datos = { ...form, total, items: form.items.map(({ id, ...item }) => ({ ...item, cantidad: parseFloat(item.cantidad || 0), precio_unit: parseFloat(item.precio_unit || 0), subtotal: parseFloat(item.subtotal || 0) })) }
    setGuardando(true)
    try {
      if (editandoId) {
        await actualizarContrato(editandoId, datos); setEditandoId(null)
      } else {
        const ultimoNum = (contratos || []).reduce((max, c) => { const num = parseInt(c.numero?.replace('CON-', '') || '0'); return num > max ? num : max }, 0)
        const numero = `CON-${String(ultimoNum + 1).padStart(4, '0')}`
        await agregarContrato({ ...datos, numero })
      }
      setMostrarForm(false); setForm(formInicial())
    } catch (err) { console.error(err) }
    finally { setGuardando(false) }
  }

  function guardarFirma(imgData) {
    if (firmaActiva === 'proveedor') setForm(prev => ({ ...prev, firma_proveedor: imgData }))
    if (firmaActiva === 'cliente')   setForm(prev => ({ ...prev, firma_cliente:   imgData }))
    setFirmaActiva(null)
  }

  async function guardarFirmaEnContrato(campo, imgData) {
    if (!seleccionado) return
    const updated = await actualizarContrato(seleccionado.id, { [campo]: imgData })
    if (updated) setSeleccionado(updated)
    setFirmaActiva(null)
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Contratos</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{(contratos || []).length} contratos registrados</p>
        </div>
        <button onClick={() => setOrigenModal(true)}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Nuevo contrato
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {Object.entries(estadoConfig).map(([key, val]) => (
            <div key={key} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{val.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: val.color }}>{(contratos || []).filter(c => c.estado === key).length}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(contratos || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8' }}>
              <FileText size={36} style={{ opacity: 0.3, marginBottom: '10px' }} /><p>No hay contratos registrados aún</p>
            </div>
          ) : (contratos || []).map(c => {
            const est = estadoConfig[c.estado] || estadoConfig.borrador
            const tipo = tipoConfig[c.tipo]    || tipoConfig.venta
            return (
              <div key={c.id}
                style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2D4A2D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e0d8c8'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }} onClick={() => setSeleccionado(c)}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: tipo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={18} color={tipo.color} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>{c.numero}</p>
                      <span style={{ fontSize: '10px', backgroundColor: tipo.bg, color: tipo.color, padding: '1px 7px', borderRadius: '20px', fontWeight: '600' }}>{tipo.label}</span>
                      {c.firma_cliente && <span style={{ fontSize: '10px', backgroundColor: '#EAF3DE', color: '#3B6D11', padding: '1px 7px', borderRadius: '20px', fontWeight: '600' }}>✓ Firmado</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.cliente_nombre} · {c.fecha}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: '#2D4A2D' }}>S/ {parseFloat(c.total || 0).toFixed(2)}</p>
                  <span style={{ fontSize: '11px', backgroundColor: est.bg, color: est.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{est.label}</span>
                  <button onClick={e => { e.stopPropagation(); generarPDFContrato(c) }} style={{ background: '#EAF3DE', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Download size={14} color="#3B6D11" /></button>
                  <button onClick={e => { e.stopPropagation(); abrirEditar(c) }} style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={14} color="#185FA5" /></button>
                  <button onClick={e => { e.stopPropagation(); setConfirmarEliminar(c) }} style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} color="#A32D2D" /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal origen */}
      {origenModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>¿Cómo crear el contrato?</p>
              <button onClick={() => setOrigenModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Desde una cotización existente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {(cotizaciones || []).length === 0 ? <p style={{ fontSize: '12px', color: '#888' }}>No hay cotizaciones</p> :
                    (cotizaciones || []).map(cot => (
                      <button key={cot.id} onClick={() => desdeOrigenCotizacion(cot)}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#f9f6f0', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>{cot.numero}</strong> — {cot.cliente_nombre}</span>
                        <span style={{ color: '#2D4A2D', fontWeight: '700' }}>S/ {parseFloat(cot.total || 0).toFixed(2)}</span>
                      </button>
                    ))}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e0d8c8' }} />
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Desde una venta existente</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {(ventas || []).length === 0 ? <p style={{ fontSize: '12px', color: '#888' }}>No hay ventas</p> :
                    (ventas || []).map(v => (
                      <button key={v.id} onClick={() => desdeOrigenVenta(v)}
                        style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#f9f6f0', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span><strong>{v.numero}</strong> — {v.cliente_nombre}</span>
                        <span style={{ color: '#2D4A2D', fontWeight: '700' }}>S/ {parseFloat(v.total || 0).toFixed(2)}</span>
                      </button>
                    ))}
                </div>
              </div>
              <div style={{ borderTop: '1px solid #e0d8c8' }} />
              <button onClick={() => { setForm(formInicial()); setEditandoId(null); setOrigenModal(false); setMostrarForm(true) }}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#2D4A2D', color: '#D4C4A0', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Plus size={16} /> Crear contrato independiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {seleccionado && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionado.numero}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionado.cliente_nombre} · {seleccionado.fecha}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => generarPDFContrato(seleccionado)} style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Download size={13} /> PDF</button>
                <button onClick={() => setSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { label: 'Tipo',    valor: tipoConfig[seleccionado.tipo]?.label },
                  { label: 'Estado',  valor: estadoConfig[seleccionado.estado]?.label },
                  { label: 'Total',   valor: `S/ ${parseFloat(seleccionado.total || 0).toFixed(2)}` },
                  { label: 'Adelanto', valor: `S/ ${parseFloat(seleccionado.adelanto || 0).toFixed(2)}` },
                  { label: 'Entrega', valor: seleccionado.modo_entrega === 'obra' ? 'En obra del cliente' : seleccionado.modo_entrega === 'almacen' ? 'Recojo en almacén' : 'Según lo acordado' },
                ].map(({ label, valor }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>{label}</span>
                    <span style={{ fontSize: '13px', color: '#2a2a2a', fontWeight: '500' }}>{valor}</span>
                  </div>
                ))}
              </div>

              {/* Firma cliente en modal */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '10px' }}>Firma del cliente / representante legal</p>
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  {seleccionado.firma_cliente ? (
                    <div style={{ position: 'relative' }}>
                      <img src={seleccionado.firma_cliente} alt="Firma cliente" style={{ width: '100%', height: '70px', objectFit: 'contain', border: '1px solid #e0d8c8', borderRadius: '6px', backgroundColor: '#fff' }} />
                      <button onClick={() => guardarFirmaEnContrato('firma_cliente', null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} color="#fff" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setFirmaActiva('cliente_contrato')}
                      style={{ width: '100%', padding: '12px', borderRadius: '7px', border: '1.5px dashed #185FA5', backgroundColor: '#fff', color: '#185FA5', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <PenTool size={15} /> Agregar firma del cliente
                    </button>
                  )}
                </div>
              </div>

              {seleccionado.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionado.notas}</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => abrirEditar(seleccionado)} style={{ flex: 1, backgroundColor: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Editar</button>
                <button onClick={() => generarPDFContrato(seleccionado)} style={{ flex: 1, backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Download size={14} /> Descargar PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={32} color="#A32D2D" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>¿Eliminar contrato?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará <strong>{confirmarEliminar.numero}</strong>. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleEliminar(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas firma */}
      {firmaActiva && (
        <CanvasFirma
          titulo={firmaActiva.includes('cliente') ? 'Firma del Cliente / Representante Legal' : 'Firma del Proveedor'}
          onCancelar={() => setFirmaActiva(null)}
          onGuardar={imgData => {
            if (firmaActiva === 'cliente_contrato') guardarFirmaEnContrato('firma_cliente', imgData)
            else guardarFirma(imgData)
          }}
        />
      )}

      {/* Modal nueva / editar */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '93vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar contrato' : 'Nuevo contrato'}</p>
              <button onClick={() => { setMostrarForm(false); setEditandoId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>Tipo de contrato</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {Object.entries(tipoConfig).map(([k, v]) => (
                    <button key={k} onClick={() => setForm(prev => ({ ...prev, tipo: k }))} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', border: form.tipo === k ? `1.5px solid ${v.color}` : '1px solid #e0d8c8', backgroundColor: form.tipo === k ? v.bg : '#fff', color: form.tipo === k ? v.color : '#888', fontWeight: form.tipo === k ? '600' : '400' }}>{v.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#2D4A2D' }}>Datos del cliente / representante legal</p>
                <input type="text" placeholder="Nombre completo *" value={form.cliente_nombre} onChange={e => setForm({ ...form, cliente_nombre: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <select value={form.cliente_tipo_doc} onChange={e => setForm({ ...form, cliente_tipo_doc: e.target.value })}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    <option>DNI</option><option>RUC</option><option>CE</option>
                  </select>
                  <input type="text" placeholder="Número de documento" value={form.cliente_documento} onChange={e => setForm({ ...form, cliente_documento: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <input type="text" placeholder="Dirección (opcional)" value={form.cliente_direccion} onChange={e => setForm({ ...form, cliente_direccion: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
              </div>

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

              {form.tipo === 'servicio' && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Descripción del servicio</p>
                  <input type="text" placeholder="Ej: Corte e instalación de laja granítica" value={form.descripcion_servicio}
                    onChange={e => setForm({ ...form, descripcion_servicio: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              )}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>Ítems del contrato</p>
                  <button onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, itemVacio()] }))}
                    style={{ fontSize: '12px', color: '#2D4A2D', background: 'none', border: '1px solid #2D4A2D', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={13} /> Agregar ítem
                  </button>
                </div>
                {form.items.map(item => (
                  <div key={item.id} style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                    <input type="text" placeholder="Descripción del material o servicio" value={item.descripcion}
                      onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Cantidad</p>
                        <input type="number" min="0" value={item.cantidad} onChange={e => actualizarItem(item.id, 'cantidad', e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Unidad</p>
                        <select value={item.unidad} onChange={e => actualizarItem(item.id, 'unidad', e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                          <option>m²</option><option>ml</option><option>cm²</option><option>global</option><option>servicio</option>
                        </select>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Precio unit. (S/)</p>
                        <input type="number" min="0" value={item.precio_unit} onChange={e => actualizarItem(item.id, 'precio_unit', e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D4A2D' }}>Subtotal: S/ {(parseFloat(item.subtotal) || 0).toFixed(2)}</span>
                      {form.items.length > 1 && <button onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', fontSize: '12px' }}>Eliminar</button>}
                    </div>
                  </div>
                ))}
                <div style={{ backgroundColor: '#2D4A2D', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#D4C4A0', fontSize: '14px', fontWeight: '600' }}>Total del contrato</span>
                  <span style={{ color: '#D4C4A0', fontSize: '18px', fontWeight: '700' }}>S/ {calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Adelanto pactado (S/)</p>
                <input type="number" min="0" placeholder="0.00" value={form.adelanto} onChange={e => setForm({ ...form, adelanto: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Condiciones de pago</p>
                <textarea value={form.condiciones_pago} onChange={e => setForm({ ...form, condiciones_pago: e.target.value })}
                  rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Modo de entrega</p>
                  <select value={form.modo_entrega} onChange={e => setForm({ ...form, modo_entrega: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    <option value="obra">En obra del cliente</option>
                    <option value="almacen">Recojo en almacén</option>
                    <option value="acordado">Según lo acordado</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Plazo de entrega</p>
                  <input type="text" placeholder="Según programación acordada" value={form.plazo_entrega}
                    onChange={e => setForm({ ...form, plazo_entrega: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>

              {/* Solo firma del cliente en el formulario */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
                  Firma del cliente (opcional — también se puede agregar después)
                </p>
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  {form.firma_cliente ? (
                    <div style={{ position: 'relative' }}>
                      <img src={form.firma_cliente} alt="Firma" style={{ width: '100%', height: '50px', objectFit: 'contain', border: '1px solid #e0d8c8', borderRadius: '6px', backgroundColor: '#fff' }} />
                      <button onClick={() => setForm(prev => ({ ...prev, firma_cliente: null }))} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="#fff" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setFirmaActiva('cliente')}
                      style={{ width: '100%', padding: '10px', borderRadius: '7px', border: '1.5px dashed #185FA5', backgroundColor: '#fff', color: '#185FA5', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <PenTool size={14} /> Firmar como cliente / representante legal
                    </button>
                  )}
                  <p style={{ fontSize: '10px', color: '#aaa', marginTop: '6px' }}>La firma de Félix Mendoza Ochante se agrega automáticamente al PDF</p>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas adicionales</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones, cláusulas especiales..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <button onClick={guardar} disabled={guardando}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear contrato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
