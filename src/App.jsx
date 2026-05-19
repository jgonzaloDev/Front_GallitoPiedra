import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Inicio from './pages/Inicio'
import Catalogo from './components/Catalogo'
import Clientes from './pages/Clientes'
import Cotizaciones from './pages/Cotizaciones'
import Ventas from './pages/Ventas'

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <Routes>
          <Route path="/"         element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/ventas" element={<Ventas />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App