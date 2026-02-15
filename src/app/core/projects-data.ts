export interface Project {
  id: string;
  title: string;
  company?: string;
  role: string;
  summary: string;
  description: string;
  stack: string[];
  highlights: string[];
  logo: string;
  logoFallback: string;
  link?: string;
  year?: string;
  themeAccent: number;
}

export const PROJECTS: Project[] = [
  {
    id: 'surticket',
    title: 'SurTicket',
    company: 'Plataforma de gestión de tickets',
    role: 'Desarrolladora frontend líder',
    summary: 'Sistema web para gestión de tickets y operaciones comerciales, desarrollado como PWA con soporte móvil.',
    description:
      'Lideré el desarrollo frontend implementando funcionalidades críticas y resolviendo incidentes en producción. Definimos una arquitectura escalable en Angular y optimizamos la experiencia móvil para operación diaria.',
    stack: ['Angular 16', 'Bootstrap', 'PWA'],
    highlights: [
      'Implementación de PWA',
      'Resolución de incidentes en producción',
      'Coordinación con diseño y backend',
      'Arquitectura frontend escalable'
    ],
    logo: '/images/surticket.svg',
    logoFallback: 'ST',
    year: '2024',
    themeAccent: 0x4f8cff
  },
  {
    id: 'reale-denuncio',
    title: 'Reale Denuncio',
    company: 'Sistema de denuncias digitales',
    role: 'Líder técnica frontend',
    summary: 'Aplicación empresarial para la gestión digital de denuncias, desarrollada con Angular 18.',
    description:
      'Definí la arquitectura frontend, la base tecnológica y los estándares de desarrollo. Trabajé junto a UX/UI y backend para asegurar consistencia funcional y escalabilidad técnica.',
    stack: ['Angular 18', 'PrimeNG'],
    highlights: [
      'Angular 18 con arquitectura moderna',
      'Definición de estándares frontend',
      'Liderazgo técnico',
      'Integración con APIs'
    ],
    logo: '/images/reale.png',
    logoFallback: 'RD',
    year: '2025',
    themeAccent: 0x7d67ff
  },
  {
    id: 'reale-miniflotas',
    title: 'Reale Miniflotas',
    company: 'Plataforma de gestión de flotas',
    role: 'Líder técnica frontend',
    summary: 'Sistema de administración de flotas con tableros operativos y formularios complejos.',
    description:
      'Implementé una arquitectura basada en Angular Material y componentes reutilizables, priorizando rendimiento, consistencia visual y mantenibilidad de largo plazo.',
    stack: ['Angular 18', 'Angular Material'],
    highlights: [
      'Librería de componentes reutilizables',
      'Angular Material',
      'Formularios complejos',
      'Arquitectura modular'
    ],
    logo: '/images/reale.png',
    logoFallback: 'RM',
    year: '2025',
    themeAccent: 0x2fb4a7
  },
  {
    id: 'reale-cotizador',
    title: 'Reale Cotizador',
    company: 'Sistema de cotización',
    role: 'Desarrolladora frontend',
    summary: 'Aplicación web para cotización de productos, con integración a servicios backend.',
    description:
      'Trabajé en funcionalidades y mejoras de experiencia de usuario, manteniendo compatibilidad con versiones previas del ecosistema Angular.',
    stack: ['Angular 12', 'Bootstrap'],
    highlights: [
      'Integración con APIs',
      'Formularios dinámicos',
      'Optimización de UX',
      'Mantenimiento evolutivo'
    ],
    logo: '/images/reale.png',
    logoFallback: 'RC',
    year: '2023',
    themeAccent: 0xd48c3f
  },
  {
    id: 'landing-innevo',
    title: 'Landing Page Innevo',
    role: 'Desarrolladora frontend',
    summary: 'Landing corporativa desarrollada con Qwik, enfocada en rendimiento y carga inicial mínima.',
    description:
      'Implementé un diseño adaptativo con Tailwind y componentes optimizados para SEO, cuidando velocidad de renderizado y calidad visual.',
    stack: ['Qwik', 'Tailwind'],
    highlights: ['Framework Qwik', 'Renderizado orientado al rendimiento', 'Tailwind CSS', 'Optimización para SEO'],
    logo: '/images/Innevoo.png',
    logoFallback: 'IN',
    year: '2024',
    themeAccent: 0x38a169
  },
  {
    id: 'portal-b2b',
    title: 'Portal Comercial B2B',
    role: 'Desarrolladora full stack',
    summary: 'Portal comercial con autenticación, gestión de usuarios y consumo de múltiples servicios backend.',
    description:
      'Participé en la implementación de estado global con NgRx y en la integración con microservicios para soportar procesos comerciales y de administración.',
    stack: ['Angular', 'NgRx', 'Microservicios'],
    highlights: ['NgRx', 'Microservicios', 'Autenticación y roles', 'Arquitectura empresarial'],
    logo: '/images/portal-b2b-logo.svg',
    logoFallback: 'B2B',
    year: '2022',
    themeAccent: 0xe071ac
  },
  {
    id: 'revai-platform',
    title: 'REVAI Platform',
    company: 'REVAI',
    role: 'Desarrolladora full stack',
    summary: 'Desarrollo de funcionalidades y migración de la aplicación hacia una arquitectura de microfrontends.',
    description:
      'Trabajé con Docker para entornos de desarrollo y producción, y con bases de datos MySQL y MongoDB para soportar nuevas capacidades de negocio.',
    stack: ['React', 'Redux', 'Docker', 'Node'],
    highlights: ['Microfrontends', 'Redux', 'Docker', 'Desarrollo full stack'],
    logo: '/images/REVAI.jfif',
    logoFallback: 'RV',
    year: '2021',
    themeAccent: 0x2b6cb0
  },
  {
    id: 'follow-hub-web',
    title: 'Follow Hub Web',
    company: 'Follow Hub Digital Logístico',
    role: 'Desarrolladora frontend',
    summary: 'Desarrollo de la web institucional y componentes reutilizables en colaboración con diseño.',
    description:
      'Implementé componentes en React y Material UI alineados a Figma, priorizando consistencia visual, diseño adaptativo y una transferencia fluida con el equipo de diseño.',
    stack: ['React', 'Material UI', 'Figma'],
    highlights: [
      'Material UI',
      'Componentes reutilizables',
      'Integración diseño-desarrollo',
      'Diseño adaptativo'
    ],
    logo: '/images/Follow.png',
    logoFallback: 'FH',
    year: '2020',
    themeAccent: 0xd85757
  }
];
