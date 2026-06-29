import {
  LayoutDashboard, MapPin, Inbox, AlertTriangle, Megaphone,
  Activity, BarChart2, Globe, Send,
} from 'lucide-react'

// Estructura de navegación del panel.
// `section` => encabezado de grupo. Resto => enlace.
export const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',          end: true },
  { to: '/puntos',      icon: MapPin,          label: 'Puntos de ayuda' },
  { to: '/solicitudes', icon: Inbox,           label: 'Solicitudes',        badge: 'solicitudes' },
  { to: '/reportes',    icon: AlertTriangle,   label: 'Reportes urgentes',  badge: 'reportes' },
  { to: '/alertas',     icon: Megaphone,       label: 'Alertas oficiales' },
  { to: '/zonas',       icon: Activity,        label: 'Zonas de impacto' },
  { to: '/contadores',  icon: BarChart2,       label: 'Contadores por zona' },
  { section: 'VenezuelaConecta' },
  { to: '/recursos',    icon: Globe,           label: 'Recursos' },
  { to: '/sugerencias', icon: Send,            label: 'Sugerencias',       badge: 'sugerencias' },
]
