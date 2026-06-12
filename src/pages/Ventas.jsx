import { useState } from 'react'
import { Plus, X, ShoppingCart, Truck, CheckCircle, Clock, CreditCard, Trash2, Edit2, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Datos empresa ─────────────────────────────────────────────────────────────
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
}

const VERDE       = [45, 74, 45]
const VERDE_CLARO = [74, 124, 89]
const BEIGE       = [212, 196, 160]
const BEIGE_FONDO = [245, 240, 232]
const BLANCO      = [255, 255, 255]
const GRIS        = [80, 80, 80]
const NEGRO       = [30, 30, 30]

// ── Generador PDF Venta ───────────────────────────────────────────────────────
async function generarPDFVenta(venta) {
  const doc = new jsPDF()
  const W   = 210

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
  doc.text(`COMPROBANTE DE VENTA N.° ${venta.numero}`, W / 2, 53, { align: 'center' })

  // Cajas vendedor / cliente
  let y = 63
  const boxH  = 38
  const margen = 10
  const cajaW  = (W - margen * 2 - 6) / 2
  const caja2X = margen + cajaW + 6

  doc.setFillColor(250, 248, 244); doc.roundedRect(margen, y, cajaW, boxH, 2, 2, 'F')
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.5); doc.roundedRect(margen, y, cajaW, boxH, 2, 2, 'S')
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text('VENDEDOR', margen + 4, y + 6)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text(EMPRESA.razon_social, margen + 4, y + 12)
  doc.text(`RUC: ${EMPRESA.ruc}`, margen + 4, y + 18)
  const dl = doc.splitTextToSize(EMPRESA.direccion, cajaW - 8)
  doc.text(dl[0], margen + 4, y + 24)
  if (dl[1]) doc.text(dl[1], margen + 4, y + 29)

  doc.setFillColor(250, 248, 244); doc.roundedRect(caja2X, y, cajaW, boxH, 2, 2, 'F')
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.5); doc.roundedRect(caja2X, y, cajaW, boxH, 2, 2, 'S')
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text('CLIENTE', caja2X + 4, y + 6)
  doc.setFontSize(8); doc.setTextColor(...GRIS)
  doc.text(`Fecha: ${venta.fecha}`, caja2X + cajaW - 4, y + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)
  doc.text(venta.cliente_nombre || '', caja2X + 4, y + 12)
  if (venta.cotizacion) doc.text(`Ref. Cotización: ${venta.cotizacion}`, caja2X + 4, y + 18)
  y += boxH + 6

  // Tabla detalle
  const tableWidth = W - 20
  const tableX     = 10

  doc.setFillColor(...VERDE); doc.rect(tableX, y, tableWidth, 7, 'F')
  doc.setTextColor(...BEIGE); doc.setFontSize(9); doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE LA VENTA', W / 2, y + 5, { align: 'center' })
  y += 7

  autoTable(doc, {
    startY: y, margin: { left: tableX, right: tableX }, tableWidth,
    head: [['Descripción / Notas', 'Medio de pago', 'Total (S/)']],
    body: [[
      venta.notas || 'Venta de material',
      venta.medio_pago || 'Efectivo',
      parseFloat(venta.total || 0).toFixed(2),
    ]],
    headStyles: { fillColor: VERDE_CLARO, textColor: BLANCO, fontStyle: 'bold', halign: 'center', fontSize: 9, lineWidth: 0 },
    bodyStyles: { textColor: NEGRO, fontSize: 9, lineColor: [220, 210, 195], lineWidth: 0.3, minCellHeight: 16 },
    alternateRowStyles: { fillColor: BEIGE_FONDO },
    columnStyles: {
      0: { halign: 'left',   cellWidth: Math.round(tableWidth * 0.55) },
      1: { halign: 'center', cellWidth: Math.round(tableWidth * 0.22) },
      2: { halign: 'center', cellWidth: Math.round(tableWidth * 0.23) },
    },
    tableLineColor: [200, 190, 175], tableLineWidth: 0.3,
  })

  y = doc.lastAutoTable.finalY

  // Caja pagos
  const cajaX = tableX + tableWidth - 90
  const cajaW2 = 90

  // Total
  doc.setFillColor(250, 248, 244); doc.rect(cajaX, y, cajaW2, 8, 'F')
  doc.setDrawColor(...VERDE_CLARO); doc.setLineWidth(0.3); doc.rect(cajaX, y, cajaW2, 8, 'S')
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text('Total venta:', cajaX + 4, y + 5.5)
  doc.text(`S/ ${parseFloat(venta.total || 0).toFixed(2)}`, cajaX + cajaW2 - 4, y + 5.5, { align: 'right' })
  y += 8

  // Adelanto
  doc.setFillColor(250, 248, 244); doc.rect(cajaX, y, cajaW2, 8, 'F')
  doc.setDrawColor(...VERDE_CLARO); doc.rect(cajaX, y, cajaW2, 8, 'S')
  doc.text('Adelanto recibido:', cajaX + 4, y + 5.5)
  doc.text(`S/ ${parseFloat(venta.adelanto || 0).toFixed(2)}`, cajaX + cajaW2 - 4, y + 5.5, { align: 'right' })
  y += 8

  // Saldo pendiente
  const saldo = parseFloat(venta.total || 0) - parseFloat(venta.adelanto || 0)
  doc.setFillColor(...VERDE); doc.rect(cajaX, y, cajaW2, 10, 'F')
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BEIGE)
  doc.text('SALDO PENDIENTE:', cajaX + 4, y + 7)
  doc.text(`S/ ${saldo.toFixed(2)}`, cajaX + cajaW2 - 4, y + 7, { align: 'right' })
  y += 14

  // Info entrega
  const estadoLabel = { pendiente: 'Pendiente de entrega', en_camino: 'En camino', entregado: 'Entregado' }
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text(`Estado de entrega: ${estadoLabel[venta.estado_entrega] || venta.estado_entrega || 'Pendiente'}`, tableX, y)
  y += 8

  // Evidencia de pago
  if (venta.evidencia) {
    try {
      doc.setFillColor(...VERDE); doc.rect(tableX, y, tableWidth, 6, 'F')
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...BEIGE)
      doc.text('EVIDENCIA DE PAGO', tableX + 4, y + 4.5)
      y += 9
      const imgW = 80, imgH = 60
      const imgX = (W - imgW) / 2
      doc.addImage(venta.evidencia, 'JPEG', imgX, y, imgW, imgH)
      y += imgH + 6
    } catch (e) { console.warn('Error al agregar evidencia:', e) }
  }

  // Firma
  y += 6
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.5); doc.line(12, y, 75, y); y += 5
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text(EMPRESA.razon_social, 12, y)
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRIS)
  doc.text(`RUC: ${EMPRESA.ruc}`, 12, y + 5)

  // Pie de página
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

  doc.save(`venta_${venta.numero}.pdf`)
}

// ── Configs ───────────────────────────────────────────────────────────────────
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

// ── Componente ────────────────────────────────────────────────────────────────
export default function Ventas() {
  const { ventas, agregarVenta, actualizarVenta, eliminarVenta } = useApp()

  const [seleccionada, setSeleccionada]           = useState(null)
  const [mostrarForm, setMostrarForm]             = useState(false)
  const [editandoId, setEditandoId]               = useState(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [guardando, setGuardando]                 = useState(false)
  const [form, setForm]                           = useState(formVacio())

  const saldo = (parseFloat(form.total || 0) - parseFloat(form.adelanto || 0)).toFixed(2)

  function handleFoto(e, esModal = false) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      if (esModal && seleccionada) {
        const updated = await actualizarVenta(seleccionada.id, { evidencia: ev.target.result })
        if (updated) setSeleccionada(updated)
      } else {
        setForm(prev => ({ ...prev, evidencia: ev.target.result }))
      }
    }
    reader.readAsDataURL(file)
  }

  async function actualizarCampo(id, campo, valor) {
    const venta = ventas.find(v => v.id === id)
    if (!venta) return
    const cambios = { [campo]: valor }
    if (campo === 'adelanto') {
      const a = parseFloat(valor || 0)
      cambios.saldo       = venta.total - a
      cambios.estado_pago = calcularEstadoPago(venta.total, a)
    }
    const updated = await actualizarVenta(id, cambios)
    if (updated) setSeleccionada(updated)
  }

  async function marcarPagadoTotal(id) {
    const venta = ventas.find(v => v.id === id)
    if (!venta) return
    const updated = await actualizarVenta(id, { adelanto: venta.total, saldo: 0, estado_pago: 'pagado' })
    if (updated) setSeleccionada(updated)
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

  async function handleEliminar(id) {
    await eliminarVenta(id)
    setSeleccionada(null)
    setConfirmarEliminar(null)
  }

  async function guardarVenta() {
    if (!form.cliente_nombre || !form.total) return
    const total    = parseFloat(form.total)
    const adelanto = parseFloat(form.adelanto || 0)
    const datos = {
      ...form,
      total,
      adelanto,
      saldo:       total - adelanto,
      estado_pago: calcularEstadoPago(total, adelanto),
    }
    setGuardando(true)
    try {
      if (editandoId) {
        await actualizarVenta(editandoId, datos)
        setEditandoId(null)
      } else {
        const ultimoNum = ventas.reduce((max, v) => {
          const num = parseInt(v.numero?.replace('VTA-', '') || '0')
          return num > max ? num : max
        }, 0)
        const numero = `VTA-${String(ultimoNum + 1).padStart(4, '0')}`
        await agregarVenta({ ...datos, numero })
      }
      setMostrarForm(false)
      setForm(formVacio())
    } catch (err) {
      console.error(err)
    } finally {
      setGuardando(false)
    }
  }

  const totalVentas    = ventas.reduce((s, v) => s + (v.total   || 0), 0)
  const totalCobrado   = ventas.reduce((s, v) => s + (v.adelanto || 0), 0)
  const totalPendiente = ventas.reduce((s, v) => s + ((v.total || 0) - (v.adelanto || 0)), 0)

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
            const ep = estadoPagoConfig[v.estado_pago]    || estadoPagoConfig.pendiente
            const ee = estadoEntregaConfig[v.estado_entrega] || estadoEntregaConfig.pendiente
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
                    {((v.total || 0) - (v.adelanto || 0)) > 0 && <p style={{ fontSize: '11px', color: '#A32D2D' }}>Saldo: S/ {((v.total || 0) - (v.adelanto || 0)).toFixed(2)}</p>}
                  </div>
                  <span style={{ fontSize: '11px', backgroundColor: ep.bg, color: ep.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{ep.label}</span>
                  <span style={{ fontSize: '11px', backgroundColor: ee.bg, color: ee.color, padding: '3px 10px', borderRadius: '20px', fontWeight: '500' }}>{ee.label}</span>
                  <button onClick={e => { e.stopPropagation(); generarPDFVenta(v) }}
                    style={{ background: '#EAF3DE', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Descargar PDF">
                    <Download size={14} color="#3B6D11" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); abrirEditar(v) }}
                    style={{ background: '#E6F1FB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Edit2 size={14} color="#185FA5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setConfirmarEliminar(v) }}
                    style={{ background: '#FCEBEB', border: 'none', borderRadius: '7px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '360px', padding: '1.5rem', textAlign: 'center' }}>
            <Trash2 size={32} color="#A32D2D" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>¿Eliminar venta?</p>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>Se eliminará <strong>{confirmarEliminar.numero}</strong> de {confirmarEliminar.cliente_nombre}. No se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmarEliminar(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e0d8c8', backgroundColor: '#fff', fontSize: '13px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => handleEliminar(confirmarEliminar.id)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#A32D2D', fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#fff' }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle venta — NO se cierra con click fuera */}
      {seleccionada && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ backgroundColor: '#2D4A2D', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#D4C4A0', fontSize: '16px', fontWeight: '600' }}>{seleccionada.numero}</p>
                <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>{seleccionada.cliente_nombre} · {seleccionada.fecha}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => generarPDFVenta(seleccionada)}
                  style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Download size={13} /> PDF
                </button>
                <button onClick={() => abrirEditar(seleccionada)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit2 size={15} color="#D4C4A0" /></button>
                <button onClick={() => { setConfirmarEliminar(seleccionada); setSeleccionada(null) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={15} color="#f9a0a0" /></button>
                <button onClick={() => setSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a0b89a' }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Resumen pagos */}
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
                  <span style={{ fontSize: '13px', fontWeight: '600', color: ((seleccionada.total || 0) - (seleccionada.adelanto || 0)) > 0 ? '#A32D2D' : '#3B6D11' }}>
                    S/ {((seleccionada.total || 0) - (seleccionada.adelanto || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actualizar adelanto */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Actualizar adelanto (S/)</p>
                <input type="number" min="0" max={seleccionada.total} value={seleccionada.adelanto}
                  onChange={e => actualizarCampo(seleccionada.id, 'adelanto', parseFloat(e.target.value || 0))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none' }} />
                {((seleccionada.total || 0) - (seleccionada.adelanto || 0)) > 0 && (
                  <button onClick={() => marcarPagadoTotal(seleccionada.id)}
                    style={{ marginTop: '8px', width: '100%', padding: '9px', borderRadius: '8px', border: '1.5px solid #3B6D11', backgroundColor: '#EAF3DE', color: '#3B6D11', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    ✓ Marcar venta como totalmente cancelada
                  </button>
                )}
              </div>

              {/* Evidencia */}
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

              {/* Medio de pago */}
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

              {/* Estado entrega */}
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

              {/* Estado pago badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: (estadoPagoConfig[seleccionada.estado_pago] || estadoPagoConfig.pendiente).bg, borderRadius: '8px', padding: '10px 14px' }}>
                <CreditCard size={16} color={(estadoPagoConfig[seleccionada.estado_pago] || estadoPagoConfig.pendiente).color} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: (estadoPagoConfig[seleccionada.estado_pago] || estadoPagoConfig.pendiente).color }}>
                  Estado de pago: {(estadoPagoConfig[seleccionada.estado_pago] || estadoPagoConfig.pendiente).label}
                </span>
              </div>

              {seleccionada.notas && (
                <div style={{ backgroundColor: '#f9f6f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Notas</p>
                  <p style={{ fontSize: '13px', color: '#555' }}>{seleccionada.notas}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => generarPDFVenta(seleccionada)}
                  style={{ flex: 1, backgroundColor: '#f9f6f0', color: '#2D4A2D', border: '1px solid #e0d8c8', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Download size={14} /> Descargar PDF
                </button>
                <button onClick={() => setSeleccionada(null)}
                  style={{ flex: 1, backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  ✓ Aceptar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva / editar — NO se cierra con click fuera */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
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

              {/* Evidencia */}
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

              {/* Medio de pago */}
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

              {/* Estado entrega */}
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

              {/* Notas */}
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px' }}>Notas</p>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones..." rows={3}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e0d8c8', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              <button onClick={guardarVenta} disabled={guardando}
                style={{ width: '100%', backgroundColor: '#2D4A2D', color: '#D4C4A0', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: guardando ? 'wait' : 'pointer', opacity: guardando ? 0.7 : 1 }}>
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Registrar venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
