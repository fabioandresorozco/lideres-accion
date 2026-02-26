import { PerfilModel } from '../../../models/perfil/perfil.model';
import { CardModel } from '../../../models/utils/card.model';

const usuario: PerfilModel = JSON.parse(localStorage.getItem('usuario') || '{}');

export const CARDS_HOME: CardModel[] = [
  {
    goTo: '/private/control-accesos',
    title: 'Control y accesos',
    description: 'Gestionar el control y los accesos',
    icon: 'lock',
    showIf: ['Pastor', 'Super usuario'],
  },
  // {
  //   goTo: '/private/listar-referidos',
  //   title: 'Referidos',
  //   description: 'Listar y gestionar referidos',
  //   icon: 'view_list',
  //   showIf: ['Coordinador de iglesia', 'Pastor', 'Super usuario'],
  // },
  // {
  //   goTo: '/private/crear-referido',
  //   title: 'Crear Referido',
  //   description: 'Crear un nuevo referido',
  //   icon: 'person_add',
  //   showIf: ['Coordinador de iglesia', 'Pastor', 'Super usuario'],
  // },
  {
    goTo: '/private/crear-pastor',
    title: 'Crear administrador de zona',
    description: 'Asignar un administrador de zona',
    icon: 'record_voice_over',
    showIf: ['Super usuario'],
  },
  {
    goTo: '/private/crear-iglesia',
    title: 'Zonas',
    description: 'Ver y gestionar zonas',
    icon: 'favorite',
    showIf: ['Super usuario'],
  },
  {
    goTo: '/private/listar-comunas',
    title: 'Comunas y Barrios',
    description: 'Listar, eliminar o editar barrios y comunas',
    icon: 'location_city',
    showIf: ['Super usuario'],
  },
  {
    goTo: '/private/crear-comuna',
    title: 'Añadir Barrios',
    description: 'Crear una nueva comuna',
    icon: 'location_city',
    showIf: ['Super usuario'],
  },
  // {
  //   goTo: '/private/masivo-referidos',
  //   title: 'Carga masiva referidos',
  //   description: 'Carga masiva de referidos a través de un archivo Excel',
  //   icon: 'upload_file',
  //   showIf: ['Super usuario', 'Pastor'],
  // },
  {
    goTo: '/private/masivo-comunas',
    title: 'Carga masiva comunas',
    description: 'Carga masiva de comunas y barrios',
    icon: 'upload_file',
    showIf: ['Super usuario'],
  },
  {
    goTo: '/private/masivo-puestos-votacion',
    title: 'Carga masiva puestos',
    description: 'Carga masiva de puestos de votación',
    icon: 'upload_file',
    showIf: ['Super usuario'],
  },

  {
    goTo: '/private/listar-voluntarios',
    title: 'Voluntarios app',
    description: 'Listar y adminstrar voluntarios de la app',
    icon: 'groups',
    showIf: ['Pastor', 'Super usuario'],
  },
  // {
  //   goTo: '/private/estadisticas',
  //   title: 'Estadisticas',
  //   description: 'Estadisticas por zona',
  //   icon: 'data_usage',
  //   showIf: ['Pastor']
  // },
  // {
  //   goTo: '/private/dashboards',
  //   title: 'DashBoard',
  //   description: 'Estadisticas generales',
  //   icon: 'developer_board',
  //   showIf: ['Super usuario']
  // },
  {
    goTo: '',
    title: usuario.rol || usuario.coordinadorCasaApoyo || usuario.coordinadorTransporte ? 'Opciones de transporte' : 'Mi vehículo',
    description: 'Administrar datos de transporte',
    icon: 'directions_car',
    showIf: ['Todos'],
    action: 'vehiculo',
    requiresPostulacion: 'transporte'
  },
  {
    goTo: '',
    title: usuario.rol || usuario.coordinadorCasaApoyo || usuario.coordinadorTransporte ? 'Opciones de casas de apoyo' : 'Mi casa de apoyo',
    description: 'Puntos centrales de apoyo',
    icon: 'my_location',
    showIf: ['Todos'],
    action: 'casa-apoyo',
    requiresPostulacion: 'casaApoyo'
  },
  {
    goTo: '/private/listar-carreras',
    title: 'Carreras en ruta',
    description: 'Administra tus carreras en ruta',
    icon: 'directions_run',
    showIf: ['Pastor', 'Super usuario', 'Coordinador de transporte', 'Coordinador de casa de apoyo'],
  },
  {
    goTo: '',
    title: 'Coordinación de testigos',
    description: 'Realiza tus gestiones como testigo aquí',
    icon: 'how_to_vote',
    showIf: ['Pastor', 'Super usuario', 'Coordinador de transporte', 'Coordinador de casa de apoyo'],
    action: 'testigo',
    
  }
];
