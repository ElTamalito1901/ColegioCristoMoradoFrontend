import { TipoDocumento } from './documento.model';

export interface PadreResumen {
  id: number;
  nombreCompleto: string;
  telefono: string;
  parentesco: string;
}

export interface Estudiante {
  id: number;
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;             // número de documento
  fotoUrl: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  telefono: string | null;
  grado: string;
  seccion: string;
  anioIngreso: number | null;
  estado: string;
  fechaRegistro: string;
  padres: PadreResumen[];
  // Cuenta de acceso (tabla usuarios). null si el alumno aún no tiene cuenta.
  usuarioId: number | null;
  correo: string | null;
  usuario: string | null;
  cuentaActiva: boolean | null;
  correoVerificado: boolean;
}

export interface EstudianteRequest {
  nombreCompleto: string;
  tipoDocumento: TipoDocumento;
  dni: string;
  fotoUrl?: string | null;
  fechaNacimiento?: string | null;
  genero?: string | null;
  nacionalidad?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  grado: string;
  seccion: string;
  anioIngreso?: number | null;
  estado: string;
  /** Al crear: vacío = el DNI. Al editar: vacío = no cambiar. */
  password?: string | null;
}

export const GRADOS = ['1°', '2°', '3°', '4°', '5°', '6°'];
export const SECCIONES = ['A', 'B', 'C'];
export const ESTADOS_ESTUDIANTE = ['Activo', 'En proceso', 'Inactivo'];
