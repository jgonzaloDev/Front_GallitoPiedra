import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Users, FileText, ShoppingCart, Scissors, Grid, BarChart2, LogOut } from 'lucide-react'

const menu = [
  { label: 'Inicio',        path: '/',             icon: Home        },
  { label: 'Catálogo',      path: '/catalogo',     icon: BookOpen    },
  { label: 'Clientes',      path: '/clientes',     icon: Users       },
  { label: 'Cotizaciones',  path: '/cotizaciones', icon: FileText    },
  { label: 'Ventas',        path: '/ventas',       icon: ShoppingCart},
  { label: 'Cortes',        path: '/cortes',       icon: Scissors    },
  { label: 'Retazos',       path: '/retazos',      icon: Grid        },
  { label: 'Reportes',      path: '/reportes',     icon: BarChart2   },
]

export default function Sidebar({ onLogout, usuario }) {
  const navigate = useNavigate()
  const location = useLocation()

  const emailCorto = usuario?.email?.split('@')[0] || 'Usuario'

  return (
    <div style={{
      width: '200px', minWidth: '200px', backgroundColor: '#2D4A2D',
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(212,196,160,0.15)' }}>
        <p style={{ color: '#D4C4A0', fontSize: '15px', fontWeight: '700', lineHeight: '1.2' }}>
          Decoraciones<br />Gallito y Piedra
        </p>
        <p style={{ color: '#a0b89a', fontSize: '11px', marginTop: '4px' }}>Sistema de gestión</p>
      </div>

      {/* Menú */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {menu.map(({ label, path, icon: Icon }) => {
          const activo = location.pathname === path
          return (
            <button key={path} onClick={() => navigate(path)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                backgroundColor: activo ? 'rgba(212,196,160,0.15)' : 'transparent',
                color: activo ? '#D4C4A0' : '#a0b89a',
                fontSize: '13px', fontWeight: activo ? '600' : '400',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!activo) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!activo) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Usuario y logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(212,196,160,0.15)' }}>
        <div style={{ padding: '8px 10px', marginBottom: '6px' }}>
          <p style={{ color: '#D4C4A0', fontSize: '12px', fontWeight: '600' }}>{emailCorto}</p>
          <p style={{ color: '#a0b89a', fontSize: '11px', marginTop: '2px' }}>Administrador</p>
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(163,45,45,0.2)', color: '#f9a0a0', fontSize: '13px', fontWeight: '500' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(163,45,45,0.35)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(163,45,45,0.2)'}
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
