import { IglesiaModel } from "../iglesia/iglesia.model";

export interface PerfilModel {
  id?: string;
  nombres: string;
  apellidos: string;
  iglesia: IglesiaModel | null; // solo lo puede administrar el Pastor y Super Usuario y coordinador de iglesia
  celular: string;
  email: string;
  rol?: 'Pastor' | 'Super usuario' | 'Coordinador de iglesia' | 'Líder' | null; // solo lo puede administrar el Pastor y Super Usuario
  postulado?: PostuladoModel; // solo lo puede Crear administrar y eliminar el mismo usuario
  coordinadorCasaApoyo?: boolean | null;  // solo lo puede Crear administrar y eliminar el Pastor
  coordinadorTransporte?: boolean | null; // solo lo puede Crear administrar y eliminar el Pastor
  noCuenta: string; // dato random alfanumerico de 6 caracteres no editable
  foto?: string | null; // foto se toma de authService de foto
  apruebaUsodeDatos?: boolean; // campo para aprobar uso de datos
  puestoVotacionResponsableId?: string | null   | '';  // id   del puesto de votacion responsable   
}



export interface PostuladoModel {
  casaApoyo: boolean;
  transporte: boolean;
  testigo: boolean;
}


export interface AsigmentRolePerfilModel {
  rol: 'Pastor' | 'Super Usuario' | string | null;
  iglesia?: string;
  coordinadorTransporte?: boolean | null;
  administradorTestigos?: boolean | null;
  coordinadorCasaApoyo?: boolean | null;
}



