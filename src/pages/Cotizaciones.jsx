import { useState } from 'react'
import { Plus, X, FileText, Trash2, Download, ShoppingCart } from 'lucide-react'
import { useApp } from '../context/AppContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const EMPRESA = {
  nombre_comercial: 'Decoraciones Gallito y Piedra',
  slogan:           'Piedra y Laja: Elegancia Natural que Perdura',
  razon_social:     'Félix Mendoza Ochante',
  ruc:              '10091300775',
  direccion:        'Jr. Flor Iris Sn Asc. de Servicios Múltiples SA Int. 23 Alt. Comisaría Pamplona 1, San Juan de Miraflores - Lima - Lima',
  telefono:         '952739105',
  bcp_cuenta:       '19493170245057',
  bcp_cci:          '00219419317024505793',
  bbva_cuenta:      '00110814-0279182672-16',
  bbva_cci:         '011-814-0000279182672-16',
  nombre_titular:   'Félix Mendoza Ochante',
  condiciones_con_igv: [
    'La presente cotización tiene una validez de 15 días.',
    'Los precios incluyen IGV (18%).',
    'Forma de pago: A convenir.',
    'Tiempo estimado de ejecución: Según programación acordada.',
  ],
  condiciones_sin_igv: [
    'La presente cotización tiene una validez de 15 días.',
    'Los precios no incluyen IGV.',
    'Forma de pago: A convenir.',
    'Tiempo estimado de ejecución: Según programación acordada.',
  ],
}

const IMAGENES_PRODUCTOS = {
  'Laja Granítica Ayacuchana': '/productos/granitica.png',
  'Laja Pizarra Negra':        '/productos/pizarra.png',
  'Laja Talomoye':             '/productos/talamoye.png',
  'Laja Yura Blanca':          '/productos/yura.png',
  'Laja Arequipeña':           '/productos/arequipena.png',
  'Rococho Arequipeño':        '/productos/rococho.png',
}

const VERDE       = [45, 74, 45]
const VERDE_CLARO = [74, 124, 89]
const BEIGE       = [212, 196, 160]
const BEIGE_FONDO = [245, 240, 232]
const BLANCO      = [255, 255, 255]
const GRIS_TEXTO  = [80, 80, 80]
const NEGRO       = [30, 30, 30]

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
  modo_descripcion: 'catalogo', // 'catalogo' | 'manual'
})

function calcularSubtotal(items) { return (items || []).reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0) }
function calcularTotal(items, igv) { const s = calcularSubtotal(items); return igv ? s * 1.18 : s }

async function cargarImagen(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror  = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

async function generarPDF(cot) {
  const doc = new jsPDF()
  const sub   = calcularSubtotal(cot.items || [])
  const total = cot.total || 0
  const W     = 210
  const condiciones = cot.igv ? EMPRESA.condiciones_con_igv : EMPRESA.condiciones_sin_igv

  const imagenesBase64 = {}
  for (const item of (cot.items || [])) {
    const ruta = IMAGENES_PRODUCTOS[item.descripcion]
    if (ruta && !imagenesBase64[item.descripcion])
      imagenesBase64[item.descripcion] = await cargarImagen(ruta)
  }

  // Encabezado
  doc.setFillColor(...VERDE); doc.rect(0, 0, W, 40, 'F')
  doc.setFillColor(...BEIGE); doc.rect(0, 40, W, 3, 'F')
  doc.setTextColor(...BEIGE); doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.text(EMPRESA.nombre_comercial.toUpperCase(), W / 2, 14, { align: 'center' })
  doc.setFontSize(8); doc.setFont('helvetica', 'italic')
  doc.text(`"${EMPRESA.slogan}"`, W / 2, 21, { align: 'center' })
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
  doc.text(`RUC: ${EMPRESA.ruc}  |  Telf: ${EMPRESA.telefono}`, W / 2, 28, { align: 'center' })
  doc.text(doc.splitTextToSize(EMPRESA.direccion, 160)[0], W / 2, 35, { align: 'center' })

  // Título
  doc.setFillColor(...BEIGE_FONDO); doc.rect(0, 43, W, 14, 'F')
  doc.setTextColor(...VERDE); doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text(`COTIZACIÓN N.° ${cot.numero}`, W / 2, 53, { align: 'center' })

  // Cajas emisor / cliente
  let y = 63
  const boxH = 38, margen = 10
  const cajaW  = (W - margen * 2 - 6) / 2
  const caja2X = margen + cajaW + 6

  doc.setFillColor(250, 248, 244); doc.roundedRect(margen, y, cajaW, boxH, 2, 2, 'F')
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.5); doc.roundedRect(margen, y, cajaW, boxH, 2, 2, 'S')
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text('EMISOR', margen + 4, y + 6)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_TEXTO)
  doc.text(EMPRESA.razon_social, margen + 4, y + 12)
  doc.text(`RUC: ${EMPRESA.ruc}`, margen + 4, y + 18)
  const dl = doc.splitTextToSize(EMPRESA.direccion, cajaW - 8)
  doc.text(dl[0], margen + 4, y + 24)
  if (dl[1]) doc.text(dl[1], margen + 4, y + 29)

  doc.setFillColor(250, 248, 244); doc.roundedRect(caja2X, y, cajaW, boxH, 2, 2, 'F')
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.5); doc.roundedRect(caja2X, y, cajaW, boxH, 2, 2, 'S')
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text('CLIENTE', caja2X + 4, y + 6)
  doc.setFontSize(8); doc.setTextColor(...GRIS_TEXTO)
  doc.text(`Fecha: ${cot.fecha}`, caja2X + cajaW - 4, y + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text(cot.cliente_nombre || '', caja2X + 4, y + 12)
  if (cot.cliente_documento) doc.text(`${cot.cliente_tipo_doc || 'DNI'}: ${cot.cliente_documento}`, caja2X + 4, y + 18)
  if (cot.cliente_direccion) {
    const dc = doc.splitTextToSize(cot.cliente_direccion, cajaW - 8)
    doc.text(dc[0], caja2X + 4, y + 24)
    if (dc[1]) doc.text(dc[1], caja2X + 4, y + 29)
  }
  y += boxH + 6

  // Tabla
  const tableWidth = W - 20, tableX = 10
  const colWidths = {
    producto: Math.round(tableWidth * 0.28), formato:  Math.round(tableWidth * 0.30),
    cantidad: Math.round(tableWidth * 0.13), precio:   Math.round(tableWidth * 0.15),
    subtotal: Math.round(tableWidth * 0.14),
  }

  doc.setFillColor(...VERDE); doc.rect(tableX, y, tableWidth, 7, 'F')
  doc.setTextColor(...BEIGE); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE LA COTIZACIÓN', W / 2, y + 5, { align: 'center' })
  y += 7

  autoTable(doc, {
    startY: y, margin: { left: tableX, right: tableX }, tableWidth,
    head: [['Producto / Material', 'Formato / Tipo', 'Cantidad\n(m²)', 'Precio\nUnit. (S/)', 'Subtotal\n(S/)']],
    body: (cot.items || []).map(item => [
      item.descripcion || '', item.formato || '', item.cantidad || 0,
      parseFloat(item.precio_unit || 0).toFixed(2),
      parseFloat(item.subtotal    || 0).toFixed(2),
    ]),
    headStyles: { fillColor: VERDE_CLARO, textColor: BLANCO, fontStyle: 'bold', halign: 'center', fontSize: 9, lineWidth: 0 },
    bodyStyles: { textColor: NEGRO, fontSize: 9, lineColor: [220, 210, 195], lineWidth: 0.3, minCellHeight: 18 },
    alternateRowStyles: { fillColor: BEIGE_FONDO },
    columnStyles: {
      0: { halign: 'left',   cellWidth: colWidths.producto },
      1: { halign: 'center', cellWidth: colWidths.formato  },
      2: { halign: 'center', cellWidth: colWidths.cantidad },
      3: { halign: 'center', cellWidth: colWidths.precio   },
      4: { halign: 'center', cellWidth: colWidths.subtotal },
    },
    tableLineColor: [200, 190, 175], tableLineWidth: 0.3,
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        const item = (cot.items || [])[data.row.index]
        const img  = item ? imagenesBase64[item.descripcion] : null
        if (img) {
          const s = 12
          try { doc.addImage(img, 'PNG', data.cell.x + data.cell.width - s - 2, data.cell.y + (data.cell.height - s) / 2, s, s) } catch {}
        }
      }
    },
  })

  y = doc.lastAutoTable.finalY
  const cajaTotalX = tableX + tableWidth - 80, cajaTotalW = 80

  if (cot.igv) {
    doc.setFillColor(250, 248, 244); doc.rect(cajaTotalX, y, cajaTotalW, 8, 'F')
    doc.setDrawColor(...VERDE_CLARO); doc.setLineWidth(0.3); doc.rect(cajaTotalX, y, cajaTotalW, 8, 'S')
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_TEXTO)
    doc.text('Subtotal:', cajaTotalX + 4, y + 5.5)
    doc.text(`S/ ${sub.toFixed(2)}`, cajaTotalX + cajaTotalW - 4, y + 5.5, { align: 'right' })
    y += 8
    doc.setFillColor(250, 248, 244); doc.rect(cajaTotalX, y, cajaTotalW, 8, 'F')
    doc.setDrawColor(...VERDE_CLARO); doc.rect(cajaTotalX, y, cajaTotalW, 8, 'S')
    doc.text('IGV (18%):', cajaTotalX + 4, y + 5.5)
    doc.text(`S/ ${(sub * 0.18).toFixed(2)}`, cajaTotalX + cajaTotalW - 4, y + 5.5, { align: 'right' })
    y += 8
  }

  doc.setFillColor(...VERDE); doc.rect(cajaTotalX, y, cajaTotalW, 10, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BEIGE)
  doc.text('TOTAL A PAGAR:', cajaTotalX + 4, y + 7)
  doc.text(`S/ ${total.toFixed(2)}`, cajaTotalX + cajaTotalW - 4, y + 7, { align: 'right' })
  y += 14

  doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GRIS_TEXTO)
  if (cot.igv) doc.text('Precio incluye IGV (18%)', cajaTotalX, y)
  y += 8

  doc.setFillColor(...VERDE); doc.rect(tableX, y, tableWidth, 6, 'F')
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BEIGE)
  doc.text('CONDICIONES', tableX + 4, y + 4.5)
  y += 9
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_TEXTO); doc.setFontSize(8.5)
  condiciones.forEach(c => { doc.text(`• ${c}`, 12, y); y += 5 })

  if (cot.notas) {
    y += 2; doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
    doc.text('Observaciones:', 12, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_TEXTO)
    const nl = doc.splitTextToSize(cot.notas, tableWidth)
    doc.text(nl, 12, y); y += nl.length * 5
  }

  y += 8; doc.setDrawColor(...VERDE); doc.setLineWidth(0.5); doc.line(12, y, 75, y); y += 5
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text(EMPRESA.razon_social, 12, y)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS_TEXTO)
  doc.text(`RUC: ${EMPRESA.ruc}`, 12, y + 5)

  const yPie = 278
  doc.setFillColor(...VERDE); doc.rect(0, yPie, W, 20, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BEIGE)
  doc.text(`Teléfono: ${EMPRESA.telefono}`, 10, yPie + 6)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 220, 200)
  doc.text(`CTA BCP: ${EMPRESA.bcp_cuenta}`, 10, yPie + 11)
  doc.text(`CCI: ${EMPRESA.bcp_cci}`, 75, yPie + 11)
  doc.text(EMPRESA.nombre_titular, 165, yPie + 11)
  doc.text(`CTA BBVA: ${EMPRESA.bbva_cuenta}`, 10, yPie + 16)
  doc.text(`CCI: ${EMPRESA.bbva_cci}`, 75, yPie + 16)
  doc.text(EMPRESA.nombre_titular, 165, yPie + 16)

  doc.save(`cotizacion_${cot.numero}.pdf`)
}

export default function Cotizaciones() {
  const { cotizaciones, agregarCotizacion, actualizarCotizacion, eliminarCotizacion,
          ventas, agregarVenta, clientes, productos } = useApp()

  const [mostrarForm, setMostrarForm]             = useState(false)
  const [seleccionada, setSeleccionada]           = useState(null)
  const [editandoId, setEditandoId]               = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [guardando, setGuardando]                 = useState(false)
  const [confirmandoVenta, setConfirmandoVenta]   = useState(false)
  const [errorMsg, setErrorMsg]                   = useState('')

  const formInicial = () => ({
    cliente_id: '', cliente_nombre: '', cliente_documento: '',
    cliente_tipo_doc: 'DNI', cliente_direccion: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'borrador', items: [itemVacio()], notas: '', igv: false,
  })
  const [form, setForm] = useState(formInicial())

  function actualizarItem(id, campo, valor) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== id) return item
        const u = { ...item, [campo]: valor }
        if (campo === 'cantidad' || campo === 'precio_unit')
          u.subtotal = parseFloat(u.cantidad || 0) * parseFloat(u.precio_unit || 0)
        // Si cambia modo a manual, limpiar descripcion
        if (campo === 'modo_descripcion') u.descripcion = ''
        return u
      })
    }))
  }

  async function guardar() {
    if (!form.cliente_nombre) { setErrorMsg('El nombre del cliente es obligatorio'); return }
    setErrorMsg('')
    const total = calcularTotal(form.items, form.igv)
    const itemsLimpios = form.items.map(({ id, modo_descripcion, ...item }) => ({
      tipo: item.tipo || 'material', descripcion: item.descripcion || '',
      formato: item.formato || '', cantidad: parseFloat(item.cantidad || 0),
      unidad: item.unidad || 'm²', precio_unit: parseFloat(item.precio_unit || 0),
      subtotal: parseFloat(item.subtotal || 0),
    }))
    const datos = {
      cliente_id: form.cliente_id || null, cliente_nombre: form.cliente_nombre,
      cliente_documento: form.cliente_documento || null, cliente_tipo_doc: form.cliente_tipo_doc || 'DNI',
      cliente_direccion: form.cliente_direccion || null, fecha: form.fecha, estado: form.estado,
      items: itemsLimpios, igv: form.igv, total: parseFloat(total.toFixed(2)), notas: form.notas || null,
    }
    setGuardando(true)
    try {
      if (editandoId) {
        await actualizarCotizacion(editandoId, datos); setEditandoId(null)
      } else {
        const ultimoNum = cotizaciones.reduce((max, c) => {
          const num = parseInt(c.numero?.replace('COT-', '') || '0')
          return num > max ? num : max
        }, 0)
        const numero = `COT-${String(ultimoNum + 1).padStart(4, '0')}`
        await agregarCotizacion({ ...datos, numero })
      }
      setMostrarForm(false); setForm(formInicial())
    } catch (err) {
      console.error(err); setErrorMsg('Error al guardar. Revisa tu conexión.')
    } finally { setGuardando(false) }
  }

  async function confirmarComoVenta(cot) {
    setConfirmandoVenta(true)
    try {
      const ultimoNum = ventas.reduce((max, v) => {
        const num = parseInt(v.numero?.replace('VTA-', '') || '0')
        return num > max ? num : max
      }, 0)
      const numero = `VTA-${String(ultimoNum + 1).padStart(4, '0')}`
      await agregarVenta({
        numero, cotizacion: cot.numero, cliente_nombre: cot.cliente_nombre,
        fecha: new Date().toISOString().split('T')[0],
        total: cot.total, adelanto: 0, saldo: cot.total,
        medio_pago: 'Efectivo', estado_pago: 'pendiente', estado_entrega: 'pendiente',
        notas: `Generada desde cotización ${cot.numero}`, evidencia: null,
      })
      await actualizarCotizacion(cot.id, { estado: 'aceptada' })
      setSeleccionada(null)
      alert(`✅ Venta ${numero} creada desde cotización ${cot.numero}`)
    } catch (err) {
      console.error(err); alert('Error al crear la venta.')
    } finally { setConfirmandoVenta(false) }
  }

  function abrirEditar(c) {
    setEditandoId(c.id)
    const itemsConId = (c.items || [itemVacio()]).map(item => ({
      ...item,
      id: item.id || Date.now() + Math.random(),
      modo_descripcion: 'manual', // al editar, siempre modo manual para no perder datos
    }))
    setForm({
      cliente_id: c.cliente_id || '', cliente_nombre: c.cliente_nombre || '',
      cliente_documento: c.cliente_documento || '', cliente_tipo_doc: c.cliente_tipo_doc || 'DNI',
      cliente_direccion: c.cliente_direccion || '', fecha: c.fecha, estado: c.estado,
      items: itemsConId, notas: c.notas || '', igv: c.igv || false,
    })
    setSeleccionada(null); setMostrarForm(true); setErrorMsg('')
  }

  async function handleEliminar(id) {
    await eliminarCotizacion(id); setSeleccionada(null); setConfirmarEliminar(null)
  }

  function seleccionarCliente(clienteId) {
    const c = clientes.find(c => String(c.id) === String(clienteId))
    if (c) setForm(prev => ({ ...prev, cliente_id: clienteId, cliente_nombre: c.nombre, cliente_documento: c.documento || '', cliente_tipo_doc: c.tipo || 'DNI', cliente_direccion: c.direccion || '' }))
    else setForm(prev => ({ ...prev, cliente_id: clienteId }))
  }

  function cerrarForm()     { setMostrarForm(false); setEditandoId(null); setErrorMsg('') }
  function cerrarDetalle()  { setSeleccionada(null) }
  function cerrarEliminar() { setConfirmarEliminar(null) }

  const productosNombres = productos.map(p => p.nombre)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Cotizaciones</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{cotizaciones.length} cotizaciones registradas</p>
        </div>
        <button onClick={() => { setEditandoId(null); setForm(formInicial()); setMostrarForm(true); setErrorMsg('') }}
          style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Nueva cotización
        </button>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {Object.entries(estadoConfig).map(([key, val]) => (
            <div key={key} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
              <p style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{val.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: val.color }}>{cotizaciones.filter(c => c.estado === key).length}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cotizaciones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888', backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8' }}>
              <FileText size={36} style={{ opacity: 0.3, marginBottom: '10px' }} /><p>No hay cotizaciones aún</p>
            </div>
          ) : cotizaciones.map(c => {
            const est = estadoConfig[c.estado] || estadoConfig.borrador
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
                  <button onClick={e => { e.stopPropagation(); generarPDF(c) }} style={{ background: '#EAF3DE', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="PDF"><Download size={14} color="#3B6D11" /></button>
                  <button onClick={e => { e.stopPropagation(); abrirEditar(c) }} style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FileText size={14} color="#185FA5" /></button>
                  <button onClick={e => { e.stopPropagation(); setConfirmarEliminar(c) }} style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} color="#A32D2D" /></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal detalle */}
      {seleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionada.numero}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionada.cliente_nombre} · {seleccionada.fecha}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => generarPDF(seleccionada)} style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Download size={13} /> PDF</button>
                <button onClick={cerrarDetalle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {(seleccionada.cliente_documento || seleccionada.cliente_direccion) && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}>
                  {seleccionada.cliente_documento && <p style={{ fontSize: '12px', color: '#555' }}><strong>{seleccionada.cliente_tipo_doc}:</strong> {seleccionada.cliente_documento}</p>}
                  {seleccionada.cliente_direccion && <p style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}><strong>Dirección:</strong> {seleccionada.cliente_direccion}</p>}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {(seleccionada.items || []).map((item, idx) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f9f6f0', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {IMAGENES_PRODUCTOS[item.descripcion] && <img src={IMAGENES_PRODUCTOS[item.descripcion]} alt={item.descripcion} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                      <div>
                        <span style={{ fontSize: '10px', backgroundColor: '#fff', color: tipoItemColor[item.tipo] || '#2D4A2D', border: `1px solid ${tipoItemColor[item.tipo] || '#2D4A2D'}`, padding: '1px 7px', borderRadius: '20px', fontWeight: '600', marginRight: '8px' }}>{tipoItemLabel[item.tipo] || item.tipo}</span>
                        <span style={{ fontSize: '13px', color: '#2a2a2a' }}>{item.descripcion}</span>
                        {item.formato && <span style={{ fontSize: '12px', color: '#888' }}> · {item.formato}</span>}
                        <p style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>{item.cantidad} {item.unidad} × S/ {item.precio_unit}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2a2a2a' }}>S/ {(parseFloat(item.subtotal) || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px solid #e0d8c8', paddingTop: '12px', marginBottom: '16px' }}>
                {seleccionada.igv && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span style={{ fontSize: '13px', color: '#888' }}>Subtotal</span><span style={{ fontSize: '13px', color: '#555' }}>S/ {calcularSubtotal(seleccionada.items || []).toFixed(2)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}><span style={{ fontSize: '13px', color: '#888' }}>IGV (18%)</span><span style={{ fontSize: '13px', color: '#555' }}>S/ {(calcularSubtotal(seleccionada.items || []) * 0.18).toFixed(2)}</span></div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: '15px', fontWeight: '600', color: '#2a2a2a' }}>Total {seleccionada.igv ? '(inc. IGV)' : ''}</p>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: '#2D4A2D' }}>S/ {(seleccionada.total || 0).toFixed(2)}</p>
                </div>
              </div>
              {seleccionada.notas && <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px' }}><p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p><p style={{ fontSize: '13px', color: '#555' }}>{seleccionada.notas}</p></div>}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button onClick={() => abrirEditar(seleccionada)} style={{ flex: 1, backgroundColor: '#E6F1FB', color: '#185FA5', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Editar</button>
                <button onClick={() => generarPDF(seleccionada)} style={{ flex: 1, backgroundColor: '#f9f6f0', color: '#2D4A2D', border: '1px solid #e0d8c8', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Download size={14} /> PDF</button>
              </div>
              {seleccionada.estado !== 'aceptada' ? (
                <button onClick={() => confirmarComoVenta(seleccionada)} disabled={confirmandoVenta}
                  style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: confirmandoVenta ? 'wait' : 'pointer', opacity: confirmandoVenta ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <ShoppingCart size={16} />{confirmandoVenta ? 'Creando venta...' : 'Confirmar como venta'}
                </button>
              ) : (
                <div style={{ backgroundColor: '#EAF3DE', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingCart size={15} color="#3B6D11" />
                  <span style={{ fontSize: '13px', color: '#3B6D11', fontWeight: '500' }}>Ya confirmada como venta</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={32} color="#A32D2D" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>¿Eliminar cotización?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará <strong>{confirmarEliminar.numero}</strong>. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={cerrarEliminar} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleEliminar(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva / editar */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{editandoId ? 'Editar cotización' : 'Nueva cotización'}</p>
              <button onClick={cerrarForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Datos cliente */}
              <div style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#2D4A2D' }}>Datos del cliente</p>
                {clientes.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Seleccionar cliente registrado</p>
                    <select value={form.cliente_id} onChange={e => seleccionarCliente(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                      <option value="">— Ingresar manualmente —</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Nombre / Razón social *</p>
                  <input type="text" placeholder="Ej: Juan Andrés Calderón" value={form.cliente_nombre} onChange={e => setForm({ ...form, cliente_nombre: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${errorMsg && !form.cliente_nombre ? '#f9a0a0' : '#e0d8c8'}`, fontSize: '13px', outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Tipo doc.</p>
                    <select value={form.cliente_tipo_doc} onChange={e => setForm({ ...form, cliente_tipo_doc: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                      <option>DNI</option><option>RUC</option><option>CE</option>
                    </select>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Número</p>
                    <input type="text" placeholder="Ej: 10720519" value={form.cliente_documento} onChange={e => setForm({ ...form, cliente_documento: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Dirección (opcional)</p>
                  <input type="text" placeholder="Ej: Av. Los Olivos 234" value={form.cliente_direccion} onChange={e => setForm({ ...form, cliente_direccion: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>

              {/* Fecha y estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Fecha</p>
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Estado</p>
                  <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                    {Object.entries(estadoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Ítems */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#555' }}>Ítems</p>
                  <button onClick={() => setForm(prev => ({ ...prev, items: [...prev.items, itemVacio()] }))} style={{ fontSize: '12px', color: '#2D4A2D', background: 'none', border: '1px solid #2D4A2D', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={13} /> Agregar ítem</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {form.items.map(item => (
                    <div key={item.id} style={{ backgroundColor: '#f9f6f0', borderRadius: '10px', padding: '12px' }}>

                      {/* Fila tipo + eliminar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Object.entries(tipoItemLabel).map(([k, v]) => (
                            <button key={k} onClick={() => actualizarItem(item.id, 'tipo', k)} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', border: item.tipo === k ? `1.5px solid ${tipoItemColor[k]}` : '1px solid #e0d8c8', backgroundColor: item.tipo === k ? tipoItemColor[k] : '#fff', color: item.tipo === k ? '#fff' : '#888', fontWeight: item.tipo === k ? '600' : '400' }}>{v}</button>
                          ))}
                        </div>
                        {form.items.length > 1 && <button onClick={() => setForm(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D' }}><Trash2 size={15} /></button>}
                      </div>

                      {/* Campo material: catálogo O manual */}
                      {item.tipo === 'material' ? (
                        <div style={{ marginBottom: '8px' }}>
                          {/* Toggle catálogo / manual */}
                          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                            <button
                              onClick={() => actualizarItem(item.id, 'modo_descripcion', 'catalogo')}
                              style={{ flex: 1, padding: '5px 8px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: (item.modo_descripcion || 'catalogo') === 'catalogo' ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8', backgroundColor: (item.modo_descripcion || 'catalogo') === 'catalogo' ? '#EAF3DE' : '#fff', color: (item.modo_descripcion || 'catalogo') === 'catalogo' ? '#2D4A2D' : '#888', fontWeight: (item.modo_descripcion || 'catalogo') === 'catalogo' ? '600' : '400' }}>
                              📋 Del catálogo
                            </button>
                            <button
                              onClick={() => actualizarItem(item.id, 'modo_descripcion', 'manual')}
                              style={{ flex: 1, padding: '5px 8px', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', border: item.modo_descripcion === 'manual' ? '1.5px solid #854F0B' : '1px solid #e0d8c8', backgroundColor: item.modo_descripcion === 'manual' ? '#FAEEDA' : '#fff', color: item.modo_descripcion === 'manual' ? '#854F0B' : '#888', fontWeight: item.modo_descripcion === 'manual' ? '600' : '400' }}>
                              ✏️ Escribir manualmente
                            </button>
                          </div>

                          {/* Selector catálogo */}
                          {(item.modo_descripcion || 'catalogo') === 'catalogo' ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              {IMAGENES_PRODUCTOS[item.descripcion] && (
                                <img src={IMAGENES_PRODUCTOS[item.descripcion]} alt={item.descripcion}
                                  style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: '1px solid #e0d8c8' }} />
                              )}
                              <select value={item.descripcion} onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                                style={{ flex: 1, padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}>
                                <option value="">Selecciona producto...</option>
                                {productosNombres.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          ) : (
                            /* Campo texto libre */
                            <input
                              type="text"
                              placeholder="Escribe el nombre del material (Ej: Piedra laja irregular, Granito gris...)"
                              value={item.descripcion}
                              onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #854F0B', fontSize: '13px', outline: 'none', backgroundColor: '#fff' }}
                            />
                          )}
                        </div>
                      ) : (
                        <input type="text" placeholder="Descripción..." value={item.descripcion}
                          onChange={e => actualizarItem(item.id, 'descripcion', e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />
                      )}

                      {/* Formato */}
                      <input type="text" placeholder="Formato / Tipo (Ej: Formato 20x10, irregular...)" value={item.formato || ''}
                        onChange={e => actualizarItem(item.id, 'formato', e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', marginBottom: '8px' }} />

                      {/* Cantidad, unidad, precio */}
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
                            <option>m²</option><option>ml</option><option>cm²</option><option>servicio</option><option>unidad</option>
                          </select>
                        </div>
                        <div>
                          <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Precio unit. (S/)</p>
                          <input type="number" min="0" value={item.precio_unit} onChange={e => actualizarItem(item.id, 'precio_unit', e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D4A2D' }}>Subtotal: S/ {(parseFloat(item.subtotal) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total con IGV */}
                <div style={{ marginTop: '12px', backgroundColor: '#2D4A2D', borderRadius: '10px', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#a0b89a', fontSize: '13px' }}>Incluir IGV (18%)</span>
                    <div onClick={() => setForm(prev => ({ ...prev, igv: !prev.igv }))} style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', backgroundColor: form.igv ? '#D4C4A0' : 'rgba(255,255,255,0.2)', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: '3px', left: form.igv ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: form.igv ? '#2D4A2D' : '#fff', transition: 'left 0.2s' }} />
                    </div>
                  </div>
                  {form.igv && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a0b89a', fontSize: '12px' }}>Subtotal</span><span style={{ color: '#D4C4A0', fontSize: '12px' }}>S/ {calcularSubtotal(form.items).toFixed(2)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a0b89a', fontSize: '12px' }}>IGV (18%)</span><span style={{ color: '#D4C4A0', fontSize: '12px' }}>S/ {(calcularSubtotal(form.items) * 0.18).toFixed(2)}</span></div>
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
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {errorMsg && (
                <div style={{ backgroundColor: '#FCEBEB', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#A32D2D', fontSize: '16px' }}>⚠</span>
                  <p style={{ color: '#A32D2D', fontSize: '13px', fontWeight: '500' }}>{errorMsg}</p>
                </div>
              )}

              <button onClick={guardar} disabled={guardando} style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar cotización'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
