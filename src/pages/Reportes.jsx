import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Download, TrendingUp, Users, Package, FileText, ShoppingCart } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { useApp } from '../context/AppContext'

const COLORES     = ['#2D4A2D', '#4a7c59', '#6aaa82', '#854F0B', '#185FA5', '#A32D2D']
const COLORES_PIE = ['#2D4A2D', '#4a7c59', '#854F0B', '#185FA5', '#A32D2D', '#6aaa82']

function agruparPorFecha(ventas, modo) {
  const grupos = {}
  ventas.forEach(v => {
    let key
    if (modo === 'dia') {
      key = v.fecha
    } else if (modo === 'semana') {
      const d = new Date(v.fecha)
      const lunes = new Date(d); lunes.setDate(d.getDate() - d.getDay() + 1)
      key = lunes.toISOString().split('T')[0]
    } else {
      key = v.fecha.slice(0, 7)
    }
    if (!grupos[key]) grupos[key] = { fecha: key, total: 0, cobrado: 0, ordenes: 0 }
    grupos[key].total   += v.total   || 0
    grupos[key].cobrado += v.adelanto || 0
    grupos[key].ordenes += 1
  })
  return Object.values(grupos).sort((a, b) => a.fecha.localeCompare(b.fecha)).map(g => ({
    ...g,
    total:   parseFloat(g.total.toFixed(2)),
    cobrado: parseFloat(g.cobrado.toFixed(2)),
    fecha:   modo === 'mes' ? g.fecha : g.fecha.slice(5),
  }))
}

function calcTopProductos(cotizaciones) {
  const map = {}
  cotizaciones.forEach(cot => {
    cot.items?.forEach(item => {
      if (item.tipo === 'material' && item.descripcion) {
        const key = item.descripcion
        if (!map[key]) map[key] = { nombre: key, ventas: 0, total: 0 }
        map[key].ventas += 1
        map[key].total  += item.subtotal || 0
      }
    })
  })
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6).map(p => ({
    ...p,
    nombre: p.nombre.replace('Laja ', ''),
    total:  parseFloat(p.total.toFixed(2)),
  }))
}

function calcTopClientes(ventas) {
  const map = {}
  ventas.forEach(v => {
    const key = v.cliente_nombre
    if (!key) return
    if (!map[key]) map[key] = { nombre: key, compras: 0, total: 0 }
    map[key].compras += 1
    map[key].total   += v.total || 0
  })
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5).map(c => ({
    ...c, total: parseFloat(c.total.toFixed(2))
  }))
}

export default function Reportes() {
  const { ventas, cotizaciones } = useApp()
  const [periodo, setPeriodo]    = useState('dia')

  const ventasPorFecha = useMemo(() => agruparPorFecha(ventas, periodo), [ventas, periodo])
  const topProductos   = useMemo(() => calcTopProductos(cotizaciones), [cotizaciones])
  const topClientes    = useMemo(() => calcTopClientes(ventas),        [ventas])

  const estadosCot = useMemo(() => {
    const map = { borrador: 0, enviada: 0, aceptada: 0, rechazada: 0 }
    cotizaciones.forEach(c => { if (map[c.estado] !== undefined) map[c.estado]++ })
    return Object.entries(map).map(([estado, cantidad]) => ({ estado, cantidad }))
  }, [cotizaciones])

  const totalFacturado  = ventas.reduce((s, v) => s + (v.total   || 0), 0).toFixed(2)
  const totalCobrado    = ventas.reduce((s, v) => s + (v.adelanto || 0), 0).toFixed(2)
  const totalSaldo      = (parseFloat(totalFacturado) - parseFloat(totalCobrado)).toFixed(2)
  const totalVentas     = ventas.length
  const ventasPagadas   = ventas.filter(v => v.estado_pago === 'pagado').length
  const ventasParciales = ventas.filter(v => v.estado_pago === 'parcial').length

  // ── Exportar PDF ──────────────────────────────────────────────────────────
  function exportarPDF() {
    const doc = new jsPDF()
    const hoy = new Date().toLocaleDateString('es-PE')
    doc.setFillColor(45, 74, 45); doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(212, 196, 160); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
    doc.text('Decoraciones Gallito y Piedra', 14, 12)
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text('Reporte General del Negocio', 14, 20)
    doc.text(`Generado: ${hoy}`, 155, 20)

    doc.setTextColor(45, 74, 45); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.text('Resumen General', 14, 38)
    autoTable(doc, {
      startY: 42,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total facturado',  `S/ ${totalFacturado}`],
        ['Total cobrado',    `S/ ${totalCobrado}`],
        ['Saldo pendiente',  `S/ ${totalSaldo}`],
        ['Total ventas',     totalVentas],
        ['Ventas pagadas',   ventasPagadas],
        ['Con saldo',        ventasParciales],
      ],
      headStyles: { fillColor: [45, 74, 45], textColor: [212, 196, 160] },
      alternateRowStyles: { fillColor: [249, 246, 240] },
      styles: { fontSize: 11 },
    })

    if (topProductos.length > 0) {
      const y1 = doc.lastAutoTable.finalY + 12
      doc.setTextColor(45, 74, 45); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text('Top Productos', 14, y1)
      autoTable(doc, {
        startY: y1 + 4,
        head: [['#', 'Producto', 'Ventas', 'Total S/']],
        body: topProductos.map((p, i) => [i + 1, p.nombre, p.ventas, `S/ ${p.total}`]),
        headStyles: { fillColor: [45, 74, 45], textColor: [212, 196, 160] },
        alternateRowStyles: { fillColor: [249, 246, 240] },
        styles: { fontSize: 10 },
      })
    }

    if (topClientes.length > 0) {
      const y2 = doc.lastAutoTable.finalY + 12
      doc.setTextColor(45, 74, 45); doc.setFontSize(13); doc.setFont('helvetica', 'bold')
      doc.text('Top Clientes', 14, y2)
      autoTable(doc, {
        startY: y2 + 4,
        head: [['#', 'Cliente', 'Compras', 'Total S/']],
        body: topClientes.map((c, i) => [i + 1, c.nombre, c.compras, `S/ ${c.total}`]),
        headStyles: { fillColor: [45, 74, 45], textColor: [212, 196, 160] },
        alternateRowStyles: { fillColor: [249, 246, 240] },
        styles: { fontSize: 10 },
      })
    }

    if (ventas.length > 0) {
      doc.addPage()
      doc.setFillColor(45, 74, 45); doc.rect(0, 0, 210, 18, 'F')
      doc.setTextColor(212, 196, 160); doc.setFontSize(12); doc.setFont('helvetica', 'bold')
      doc.text('Detalle de ventas', 14, 12)
      autoTable(doc, {
        startY: 22,
        head: [['N°', 'Cliente', 'Fecha', 'Total', 'Cobrado', 'Saldo', 'Estado']],
        body: ventas.map(v => [
          v.numero, v.cliente_nombre, v.fecha,
          `S/ ${(v.total || 0).toFixed(2)}`,
          `S/ ${(v.adelanto || 0).toFixed(2)}`,
          `S/ ${((v.total || 0) - (v.adelanto || 0)).toFixed(2)}`,
          v.estado_pago
        ]),
        headStyles: { fillColor: [45, 74, 45], textColor: [212, 196, 160] },
        alternateRowStyles: { fillColor: [249, 246, 240] },
        styles: { fontSize: 8 },
      })
    }

    doc.save(`reporte_gallito_${hoy.replace(/\//g, '-')}.pdf`)
  }

  // ── Exportar Excel ────────────────────────────────────────────────────────
  function exportarExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ventas.map(v => ({
      'N° Venta':     v.numero,
      'Cliente':      v.cliente_nombre,
      'Fecha':        v.fecha,
      'Total (S/)':   v.total   || 0,
      'Cobrado (S/)': v.adelanto || 0,
      'Saldo (S/)':   parseFloat(((v.total || 0) - (v.adelanto || 0)).toFixed(2)),
      'Estado pago':  v.estado_pago,
      'Entrega':      v.estado_entrega,
    }))), 'Ventas')

    if (topProductos.length > 0)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topProductos.map((p, i) => ({
        'Posición': i + 1, 'Producto': p.nombre, 'N° Ventas': p.ventas, 'Total (S/)': p.total,
      }))), 'Top Productos')

    if (topClientes.length > 0)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topClientes.map((c, i) => ({
        'Posición': i + 1, 'Cliente': c.nombre, 'N° Compras': c.compras, 'Total (S/)': c.total,
      }))), 'Top Clientes')

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { 'Métrica': 'Total facturado (S/)',  'Valor': parseFloat(totalFacturado)  },
      { 'Métrica': 'Total cobrado (S/)',    'Valor': parseFloat(totalCobrado)    },
      { 'Métrica': 'Saldo pendiente (S/)',  'Valor': parseFloat(totalSaldo)      },
      { 'Métrica': 'Total ventas',          'Valor': totalVentas                 },
      { 'Métrica': 'Ventas pagadas',        'Valor': ventasPagadas               },
      { 'Métrica': 'Con saldo',             'Valor': ventasParciales             },
    ]), 'Resumen')

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `reporte_gallito_${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.xlsx`)
  }

  const sinDatos = ventas.length === 0

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f0e8', width: '100%' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#2D4A2D', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '600' }}>Reportes</p>
          <p style={{ color: '#a0b89a', fontSize: '12px', marginTop: '2px' }}>Dashboard general del negocio</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={exportarExcel} disabled={sinDatos}
            style={{ backgroundColor: 'rgba(212,196,160,0.2)', color: '#D4C4A0', border: '1px solid rgba(212,196,160,0.4)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: sinDatos ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: sinDatos ? 0.5 : 1 }}>
            <Download size={15} /> Excel
          </button>
          <button onClick={exportarPDF} disabled={sinDatos}
            style={{ backgroundColor: '#D4C4A0', color: '#2D4A2D', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: sinDatos ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: sinDatos ? 0.5 : 1 }}>
            <Download size={15} /> PDF
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {sinDatos ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8' }}>
            <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Aún no hay ventas registradas</p>
            <p style={{ fontSize: '13px' }}>Los reportes y gráficas aparecerán aquí cuando registres tus primeras ventas.</p>
          </div>
        ) : (
          <>
            {/* Métricas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Total facturado', valor: `S/ ${totalFacturado}`, color: '#2D4A2D', icono: TrendingUp   },
                { label: 'Total cobrado',   valor: `S/ ${totalCobrado}`,   color: '#3B6D11', icono: ShoppingCart },
                { label: 'Saldo pendiente', valor: `S/ ${totalSaldo}`,     color: '#A32D2D', icono: FileText     },
                { label: 'Total ventas',    valor: totalVentas,             color: '#185FA5', icono: Package      },
                { label: 'Ventas pagadas',  valor: ventasPagadas,           color: '#3B6D11', icono: Users        },
                { label: 'Con saldo',       valor: ventasParciales,         color: '#854F0B', icono: FileText     },
              ].map((m, i) => {
                const Icon = m.icono
                return (
                  <div key={i} style={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e0d8c8', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Icon size={16} color={m.color} />
                      <p style={{ fontSize: '11px', color: '#888' }}>{m.label}</p>
                    </div>
                    <p style={{ fontSize: typeof m.valor === 'string' ? '15px' : '24px', fontWeight: '700', color: m.color }}>{m.valor}</p>
                  </div>
                )
              })}
            </div>

            {/* Ventas por período */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A2D' }}>Ventas por período</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[{ key: 'dia', label: 'Por día' }, { key: 'semana', label: 'Por semana' }, { key: 'mes', label: 'Por mes' }].map(p => (
                    <button key={p.key} onClick={() => setPeriodo(p.key)} style={{
                      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                      border: periodo === p.key ? '1.5px solid #2D4A2D' : '1px solid #e0d8c8',
                      backgroundColor: periodo === p.key ? '#2D4A2D' : '#fff',
                      color: periodo === p.key ? '#D4C4A0' : '#888',
                      fontWeight: periodo === p.key ? '600' : '400',
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ventasPorFecha} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `S/${v}`} />
                  <Tooltip formatter={v => [`S/ ${v}`]} />
                  <Legend />
                  <Bar dataKey="total"   name="Facturado" fill="#2D4A2D" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cobrado" name="Cobrado"   fill="#6aaa82" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Productos + Clientes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>

              {/* Torta productos */}
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', padding: '1.25rem' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A2D', marginBottom: '16px' }}>Productos más vendidos</p>
                {topProductos.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={topProductos} dataKey="total" nameKey="nombre" cx="50%" cy="50%" outerRadius={75}>
                          {topProductos.map((_, i) => <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => [`S/ ${v}`, 'Total']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      {topProductos.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORES_PIE[i % COLORES_PIE.length], flexShrink: 0 }} />
                          <span style={{ fontSize: '12px', color: '#555', flex: 1 }}>{p.nombre}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#2D4A2D' }}>S/ {p.total}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem' }}>Sin datos de cotizaciones aún</p>
                )}
              </div>

              {/* Barras clientes */}
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', padding: '1.25rem' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A2D', marginBottom: '16px' }}>Clientes que más compran</p>
                {topClientes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topClientes.map((c, i) => {
                      const maxTotal = topClientes[0].total
                      const pct = (c.total / maxTotal) * 100
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: i === 0 ? '#2D4A2D' : '#f0ebe0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: i === 0 ? '#D4C4A0' : '#888' }}>{i + 1}</span>
                              </div>
                              <span style={{ fontSize: '13px', color: '#2a2a2a', fontWeight: i === 0 ? '600' : '400' }}>{c.nombre}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: '13px', fontWeight: '700', color: '#2D4A2D' }}>S/ {c.total}</p>
                              <p style={{ fontSize: '11px', color: '#888' }}>{c.compras} compra{c.compras !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div style={{ height: '6px', backgroundColor: '#f0ebe0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: COLORES[i % COLORES.length], borderRadius: '3px' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', padding: '2rem' }}>Sin datos de ventas aún</p>
                )}
              </div>
            </div>

            {/* Estado cotizaciones + Tendencia */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', padding: '1.25rem' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A2D', marginBottom: '16px' }}>Estado de cotizaciones</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={estadosCot} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="estado" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="cantidad" name="Cantidad" radius={[0, 4, 4, 0]}>
                      {estadosCot.map((e, i) => (
                        <Cell key={i} fill={e.estado === 'aceptada' ? '#3B6D11' : e.estado === 'enviada' ? '#185FA5' : e.estado === 'rechazada' ? '#A32D2D' : '#888'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', padding: '1.25rem' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A2D', marginBottom: '16px' }}>Tendencia de facturación</p>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={agruparPorFecha(ventas, 'dia')} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8c8" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10 }} interval={1} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `S/${v}`} />
                    <Tooltip formatter={v => [`S/ ${v}`]} />
                    <Line type="monotone" dataKey="total"   stroke="#2D4A2D" strokeWidth={2} dot={{ r: 3 }} name="Facturado" />
                    <Line type="monotone" dataKey="cobrado" stroke="#6aaa82" strokeWidth={2} dot={{ r: 3 }} name="Cobrado" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tabla detalle */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e0d8c8', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e0d8c8' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2D4A2D' }}>Detalle de ventas</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9f6f0' }}>
                      {['N° Venta', 'Cliente', 'Fecha', 'Total', 'Cobrado', 'Saldo', 'Estado'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', color: '#555', fontWeight: '600', textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v, i) => {
                      const saldo       = ((v.total || 0) - (v.adelanto || 0)).toFixed(2)
                      const estadoColor = v.estado_pago === 'pagado' ? '#3B6D11' : '#854F0B'
                      const estadoBg    = v.estado_pago === 'pagado' ? '#EAF3DE' : '#FAEEDA'
                      return (
                        <tr key={v.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f6f0', borderBottom: '1px solid #e0d8c8' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: '#2a2a2a' }}>{v.numero}</td>
                          <td style={{ padding: '10px 14px', color: '#555' }}>{v.cliente_nombre}</td>
                          <td style={{ padding: '10px 14px', color: '#888' }}>{v.fecha}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: '#2D4A2D' }}>S/ {(v.total || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: '#3B6D11' }}>S/ {(v.adelanto || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: parseFloat(saldo) > 0 ? '#A32D2D' : '#888' }}>S/ {saldo}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '11px', backgroundColor: estadoBg, color: estadoColor, padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>
                              {v.estado_pago === 'pagado' ? 'Pagado' : 'Con saldo'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#2D4A2D' }}>
                      <td colSpan={3} style={{ padding: '10px 14px', color: '#D4C4A0', fontWeight: '600' }}>TOTALES</td>
                      <td style={{ padding: '10px 14px', color: '#D4C4A0', fontWeight: '700' }}>S/ {totalFacturado}</td>
                      <td style={{ padding: '10px 14px', color: '#D4C4A0', fontWeight: '700' }}>S/ {totalCobrado}</td>
                      <td style={{ padding: '10px 14px', color: '#f9a0a0', fontWeight: '700' }}>S/ {totalSaldo}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
