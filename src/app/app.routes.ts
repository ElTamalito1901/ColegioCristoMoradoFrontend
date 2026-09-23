import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Layout } from './shared/layout/layout/layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, permisoGuard } from './core/guards/admin.guard';
import { docenteGuard } from './core/guards/docente.guard';
import { alumnoGuard } from './core/guards/alumno.guard';
import { padreGuard } from './core/guards/padre.guard';

// --- Admin ---
import { Dashboard } from './admin/pages/dashboard/dashboard';
import { Comunicados } from './admin/pages/comunicados/comunicados';
import { MisCitas } from './admin/pages/agenda/mis-citas/mis-citas';
import { Disponibilidad } from './admin/pages/agenda/disponibilidad/disponibilidad';
import { GradosSecciones } from './admin/pages/academico/grados-secciones/grados-secciones';
import { CatalogoCursos } from './admin/pages/academico/catalogo-cursos/catalogo-cursos';
import { Periodos } from './admin/pages/academico/periodos/periodos';
import { VinculoPadreHijo } from './admin/pages/academico/vinculo-padre-hijo/vinculo-padre-hijo';
import { Students } from './admin/pages/usuarios/alumnos/students';
import { Parents } from './admin/pages/usuarios/padres/parents';
import { Teachers } from './admin/pages/usuarios/docentes/teachers';
import { PersonalStaff } from './admin/pages/usuarios/administrativo/personal-staff';
import { Reportes } from './admin/pages/reportes/reportes';
import { Directiva } from './admin/pages/directiva/directiva';
import { Perfil } from './admin/pages/perfil/perfil';
import { Configuracion } from './admin/pages/configuracion/configuracion';

// --- Docente / Alumno / Padre (aún sin contenido, solo el acceso base) ---
import { DocenteDashboard } from './pages/docente/pages/dashboard/dashboard';
import { AlumnoDashboard } from './pages/alumno/pages/dashboard/dashboard';
import { PadreDashboard } from './pages/padre/pages/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    // Layout contiene el siderbar + navbar; cada hijo es el contenido
    // que se muestra al hacer click en un botón del menú lateral.
    // authGuard exige sesión iniciada para entrar a cualquier /home/**.
    path: 'home',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'admin/inicio', pathMatch: 'full' },

      {
        // Todo lo del rol Administrador vive bajo /home/admin/**.
        // adminGuard verifica que el usuario logeado tenga ese rol.
        // Esta ruta no tiene 'component': solo agrupa el guard y sus
        // hijos se siguen mostrando en el <router-outlet> de Layout.
        path: 'admin',
        canActivate: [adminGuard],
        // Directiva: cada página pide su permiso (data.permiso).
        canActivateChild: [permisoGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },

          { path: 'inicio', component: Dashboard, data: { titulo: 'Inicio' } },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },

          { path: 'agenda/mis-citas', component: MisCitas, data: { titulo: 'Mis Citas' } },
          { path: 'agenda/disponibilidad', component: Disponibilidad, data: { titulo: 'Disponibilidad' } },

          { path: 'academico/grados-secciones', component: GradosSecciones, data: { titulo: 'Grados y Secciones', permiso: 'ACADEMICO' } },
          { path: 'academico/catalogo-cursos', component: CatalogoCursos, data: { titulo: 'Catálogo de Cursos', permiso: 'ACADEMICO' } },
          { path: 'academico/periodos', component: Periodos, data: { titulo: 'Periodos', permiso: 'ACADEMICO' } },
          { path: 'academico/vinculo-padre-hijo', component: VinculoPadreHijo, data: { titulo: 'Vínculo Padre-Hijo', permiso: 'ACADEMICO' } },

          { path: 'usuarios/alumnos', component: Students, data: { titulo: 'Alumnos', permiso: 'USUARIOS' } },
          { path: 'usuarios/padres', component: Parents, data: { titulo: 'Padres', permiso: 'USUARIOS' } },
          { path: 'usuarios/docentes', component: Teachers, data: { titulo: 'Docentes', permiso: 'USUARIOS' } },
          { path: 'usuarios/administrativo', component: PersonalStaff, data: { titulo: 'Personal Staff', permiso: 'USUARIOS' } },

          { path: 'reportes', component: Reportes, data: { titulo: 'Reportes', permiso: 'REPORTES' } },

          // No están en el menú lateral todavía (no aparecían en el diseño
          // que compartiste). Quedan accesibles por URL / navbar mientras
          // decides si los agregas al sidebar o los quitas.
          { path: 'directiva', component: Directiva, data: { titulo: 'Directiva' } },
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },

      // Cada rol nuevo va aquí como hermano de 'admin', con su propio
      // guard y sus propios hijos. Por ahora solo tienen el 'inicio'
      // (dashboard vacío) para poder entrar; se les agrega contenido
      // real de la misma forma en que se hizo con 'admin'.
      {
        path: 'docente',
        canActivate: [docenteGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },
          { path: 'inicio', component: DocenteDashboard, data: { titulo: 'Inicio' } },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },
          // Perfil y Configuración reusan los mismos componentes de admin:
          // ambos trabajan siempre sobre el usuario logeado (AuthService),
          // así que no hace falta duplicar el código por rol.
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },
      {
        path: 'alumno',
        canActivate: [alumnoGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },
          { path: 'inicio', component: AlumnoDashboard, data: { titulo: 'Inicio' } },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },
      {
        path: 'padre',
        canActivate: [padreGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },
          { path: 'inicio', component: PadreDashboard, data: { titulo: 'Inicio' } },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },
    ]
  },
  {
    // Cualquier ruta no encontrada vuelve al login.
    path: '**',
    redirectTo: 'login'
  }
];
