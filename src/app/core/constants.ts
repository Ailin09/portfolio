export const SECTIONS = [
  { id: 'home' as const, label: 'Inicio', route: '/' },
  { id: 'proyectos' as const, label: 'Proyectos', route: '/proyectos' },
  { id: 'certificaciones' as const, label: 'Certificaciones', route: '/certificaciones' },
  { id: 'sobre-mi' as const, label: 'Sobre mí', route: '/sobre-mi' },
  { id: 'contacto' as const, label: 'Contacto', route: '/contacto' }
] as const;
