import { AuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { Routes } from '@angular/router';
import { emailVerifiedGuard } from '../../shared/guards/email-verified.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./private.component').then(m => m.PrivateComponent),
    canActivate: [AuthGuard, emailVerifiedGuard],
    data: { authGuardPipe: () => redirectUnauthorizedTo(['./public/login']) },
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
      },
      {
        path: 'crear-iglesia',
        loadComponent: () => import('./iglesia/crear-iglesia.component').then(m => m.CrearIglesiaComponent),
      },
      {
        path: 'crear-comuna',
        loadComponent: () => import('./comuna/comuna.component').then(m => m.ComunaComponent),
      },
      {
        path: 'listar-comunas',
        loadComponent: () => import('./comuna/listar-comunas/listar-comunas.component').then(m => m.ListarComunasComponent),
      },
      {
        path: 'editar-comuna/:id',
        loadComponent: () => import('./comuna/editar-comuna/editar-comuna.component').then(m => m.EditarComunaComponent),
      },
      {
        path: 'crear-referido',
        loadComponent: () => import('./referido/create/create-referido.component').then(m => m.CreateReferidoComponent),
      },
      {
        path: 'editar-referido/:id',
        loadComponent: () => import('./referido/create/create-referido.component').then(m => m.CreateReferidoComponent),
      },
      {
        path: 'listar-referidos',
        loadComponent: () => import('./referido/lista-referidos/lista-referidos.component').then(m => m.ListaReridosComponent),
      },
      {
        path: 'control-accesos',
        loadComponent: () => import('./control-accesos/control-accesos.component').then(m => m.ControlAccesosComponent),
      },
      {
        path: 'crear-pastor',
        loadComponent: () => import('./crear-pastor/crear-pastor.component').then(m => m.CrearPastorComponent),
      },
      {
        path: 'masivo-referidos',
        loadComponent: () => import('./masivo-referidos/masivo-referidos.component').then(m => m.MasivoReferidosComponent),
      },
      {
        path: 'masivo-comunas',
        loadComponent: () => import('./masivo-comunas/masivo-comunas.component').then(m => m.MasivoComunasComponent),
      },
      {
        path: 'masivo-puestos-votacion',
        loadComponent: () => import('./masivo-puestos-votacion/masivo-puestos-votacion.component').then(m => m.MasivoPuestosVotacionComponent),
      },

      {
        path: 'activar-testigo',
        loadComponent: () => import('./testigos/activar-testigo/activar-testigo.component').then(m => m.ActivarTestigoComponent),
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./estadisticas/estadisticas.component').then(m => m.EstadisticasComponent),
      },
      {
        path: 'mi-vehiculo',
        loadComponent: () => import('./mi-vehiculo/mi-vehiculo.component').then(m => m.MiVehiculoComponent),
      },
      {
        path: 'mi-perfil',
        loadComponent: () => import('./mi-perfil/mi-perfil.component').then(m => m.MiPerfilComponent),
      },
      {
        path: 'listar-vehiculos-aprobados',
        loadComponent: () => import('./lista-vehiculos-aprobados/lista-vehiculos-aprobados.component').then(m => m.ListaVehiculosAprobadosComponent),
      },
      {
        path: 'mi-casa-de-apoyo',
        loadComponent: () => import('./mi-casa-de-apoyo/mi-casa-de-apoyo.component').then(m => m.MiCasaDeApoyoComponent),
      },
      {
        path: 'inscribir-casas-apoyo',
        loadComponent: () => import('./inscribir-casas-apoyo/inscribir-casas-apoyo.component').then(m => m.InscribirCasasApoyoComponent),
      },
      {
        path: 'listar-casas-apoyo',
        loadComponent: () => import('./listar-casas-apoyo/listar-casas-apoyo.component').then(m => m.ListarCasasApoyoComponent),
      },
      {
        path: 'aprobar-vehiculos',
        loadComponent: () => import('./aprobar-vehiculos/aprobar-vehiculos.component').then(m => m.AprobarVehiculosComponent),
      },
      {
        path: 'aprobar-casas-apoyo',
        loadComponent: () => import('./aprobar-casas-apoyo/aprobar-casas-apoyo.component').then(m => m.AprobarCasasApoyoComponent),
      },
      {
        path: 'listar-voluntarios',
        loadComponent: () => import('./listar-voluntarios/listar-voluntarios.component').then(m => m.ListarVoluntariosComponent),
      },

      {
        path: 'listar-carreras',
        loadComponent: () => import('./listar-carreras/listar-carreras.component').then(m => m.ListarCarrerasComponent),
      },
    ]
  },
  {
    path: 'mis-testigos',
    loadComponent: () =>
      import('./gestion-testigos/gestion-testigos.component').then(
        (m) => m.GestionTestigosComponent
      ),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
