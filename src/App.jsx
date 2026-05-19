import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Inicio from './pages/Inicio'
import Catalogo from './components/Catalogo'

function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <Routes>
          <Route path="/"         element={<Inicio />} />
          <Route path="/catalogo" element={<Catalogo />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App