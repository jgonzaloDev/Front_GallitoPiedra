import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Inicio from './pages/Inicio'
import Catalogo from './components/Catalogo'
import Clientes from './pages/Clientes'
import Cotizaciones from './pages/Cotizaciones'
import Ventas from './pages/Ventas'
import Cortes from './pages/Cortes'
import Retazos from './pages/Retazos' //  Corregido el nombre del import
import Reportes from './pages/Reportes'

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <Routes>
          <Route path="/"             element={<Inicio />} />
          <Route path="/catalogo"     element={<Catalogo />} />
          <Route path="/clientes"     element={<Clientes />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/ventas"       element={<Ventas />} />
          <Route path="/cortes"       element={<Cortes />} />
          <Route path="/retazos"      element={<Retazos />} /> {/* Ahora sí usará el componente correcto */}
          <Route path="/reportes"     element={<Reportes />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App