import { SidebarEntry } from '../../shared/layout/siderbar/siderbar';

/**
 * Menú lateral del rol Docente. Empieza solo con Dashboard; agrega más
 * entradas aquí a medida que construyas las secciones de este rol,
 * siguiendo el mismo formato que admin-sidebar.config.ts.
 */
export const DOCENTE_SIDEBAR_ITEMS: SidebarEntry[] = [
  {
    type: 'link',
    id: 'dashboard',
    label: 'Dashboard',
    route: ['/home', 'docente', 'inicio'],
    icon: 'M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z',
  },
  {
    type: 'link',
    id: 'comunicados',
    label: 'Comunicados',
    route: ['/home', 'docente', 'comunicados'],
    icon: 'M3 11l18-7-7 18-2-8-9-3Z',
  },
  {
    type: 'group',
    id: 'cuenta',
    label: 'Mi Cuenta',
    icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
    children: [
      { id: 'perfil', label: 'Mi Perfil', route: ['/home', 'docente', 'perfil'] },
      { id: 'configuracion', label: 'Configuración', route: ['/home', 'docente', 'configuracion'] },
    ],
  },
];
