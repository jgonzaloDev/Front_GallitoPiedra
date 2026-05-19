import { NavLink } from 'react-router-dom'
import {
  Home, BookOpen, Users, FileText,
  ShoppingCart, Scissors, Grid, BarChart2
} from 'lucide-react'

const navItems = [
  { to: '/',             icon: Home,         label: 'Inicio' },
  { to: '/catalogo',     icon: BookOpen,     label: 'Catálogo' },
  { to: '/clientes',     icon: Users,        label: 'Clientes' },
  { to: '/cotizaciones', icon: FileText,     label: 'Cotizaciones' },
  { to: '/ventas',       icon: ShoppingCart, label: 'Ventas' },
  { to: '/cortes',       icon: Scissors,     label: 'Cortes' },
  { to: '/retazos',      icon: Grid,         label: 'Retazos' },
  { to: '/reportes',     icon: BarChart2,    label: 'Reportes' },
]

export default function Sidebar() {
  return (
    <div style={{
      width: '210px',
      minHeight: '100vh',
      backgroundColor: '#2D4A2D',
      padding: '1rem',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo */}
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
        <p style={{ color: '#D4C4A0', fontSize: '14px', fontWeight: '600', lineHeight: '1.4' }}>
          Decoraciones<br />Gallito y Piedra
        </p>
        <p style={{ color: '#a0b89a', fontSize: '11px', marginTop: '4px' }}>Sistema de gestión</p>
      </div>

      {/* Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 10px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '400',
              backgroundColor: isActive ? 'rgba(212,196,160,0.15)' : 'transparent',
              color: isActive ? '#D4C4A0' : '#a0b89a',
              transition: 'all 0.15s',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}