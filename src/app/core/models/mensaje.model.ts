export interface Participante {
  usuarioId: number | null;
  nombre: string;
  rol: string;
  leido: boolean;
}

export interface Mensaje {
  id: number;
  asunto: string;
  contenido: string;          // HTML simple del editor
  fechaEnvio: string;
  respuestaAId: number | null;
  remitente: Participante;
  destinatarios: Participante[];
  leido: boolean;
  bandeja: 'RECIBIDO' | 'ENVIADO';
}

export interface MensajeRequest {
  destinatariosIds: number[];
  asunto: string;
  contenido: string;
  respuestaAId?: number | null;
}

export interface Contacto {
  usuarioId: number;
  nombre: string;
  rol: string;       // Administración | Docente | Estudiante | Padre
  detalle: string;   // "5° A" para alumnos, especialidad para docentes
}

export interface GrupoContacto {
  clave: string;
  nombre: string;
  descripcion: string;
  usuariosIds: number[];
}

export interface Contactos {
  contactos: Contacto[];
  grupos: GrupoContacto[];
}

export interface Notificaciones {
  comunicadosNoLeidos: number;
  mensajesNoLeidos: number;
  total: number;
}
