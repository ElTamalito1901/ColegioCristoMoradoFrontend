export type GrupoDestino = 'TODOS' | 'ADMINISTRATIVO' | 'DOCENTES' | 'ALUMNOS' | 'PADRES';

export interface Comunicado {
  id: number;
  titulo: string;
  contenido: string;          // HTML simple del editor
  imagen: string | null;      // data URL o enlace
  anuncio: boolean;           // true = se muestra en grande al entrar
  destinatarios: GrupoDestino[];
  autorId: number | null;
  autorNombre: string;
  autorRol: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  leido: boolean;
  totalLecturas: number;
}

export interface ComunicadoRequest {
  titulo: string;
  contenido: string;
  imagen: string | null;
  anuncio: boolean;
  destinatarios: GrupoDestino[];
}

export const GRUPOS_DESTINO: { valor: GrupoDestino; etiqueta: string; icono: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos', icono: '🏫' },
  { valor: 'ADMINISTRATIVO', etiqueta: 'Todo el Personal Administrativo', icono: '👤' },
  { valor: 'DOCENTES', etiqueta: 'Todos los Maestros', icono: '👩‍🏫' },
  { valor: 'ALUMNOS', etiqueta: 'Todos los Alumnos', icono: '🎓' },
  { valor: 'PADRES', etiqueta: 'Todos los Padres', icono: '👪' },
];

export function etiquetaGrupo(g: string): string {
  const corto: Record<string, string> = {
    TODOS: 'Todos', ADMINISTRATIVO: 'Administrativos', DOCENTES: 'Docentes', ALUMNOS: 'Alumnos', PADRES: 'Padres',
  };
  return corto[g] ?? g;
}
