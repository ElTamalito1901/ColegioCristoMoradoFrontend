import { Docente } from './docente.model';
import { Estudiante } from './estudiante.model';
import { PadreFamilia } from './padre.model';
import { Personal } from './personal.model';

export interface Perfil {
  usuarioId: number;
  nombre: string;
  usuario: string;
  correo: string | null;
  correoVerificado: boolean;
  rol: string;
  estado: boolean;
  fechaRegistro: string;
  /** false para alumnos: sus datos solo los cambia la administración. */
  puedeEditar: boolean;
  // Registro completo de la persona según su rol (solo uno viene lleno)
  docente: Docente | null;
  estudiante: Estudiante | null;
  padre: PadreFamilia | null;
  personal: Personal | null;     // Directiva / Personal Staff
  /** Permisos del panel (admin: todos; Directiva: los que le asignó el admin). */
  permisos: string[];
}

export interface PerfilUpdateRequest {
  nombre?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fotoUrl?: string | null;
}

export interface CambiarPasswordRequest {
  passwordActual: string;
  passwordNueva: string;
  codigo: string;          // código enviado al Gmail verificado
}

/** Respuesta al pedir un código de verificación. */
export interface CodigoEnviado {
  correoEnmascarado: string;
  minutosValidez: number;
  segundosParaReenviar: number;
  /** Solo en modo prueba (backend sin Gmail configurado). */
  codigoPrueba: string | null;
}
