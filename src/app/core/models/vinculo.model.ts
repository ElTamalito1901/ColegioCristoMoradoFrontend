import { TipoDocumento } from './documento.model';

export interface Vinculo {
  id: number;
  parentesco: string;
  padreId: number;
  padreNombre: string;
  padreTipoDocumento: TipoDocumento;
  padreDocumento: string;
  padreTelefono: string | null;
  padreEstado: string;
  estudianteId: number;
  estudianteNombre: string;
  estudianteTipoDocumento: TipoDocumento;
  estudianteDocumento: string;
  grado: string;
  seccion: string;
  estudianteEstado: string;
}

export interface VinculoRequest {
  padreId?: number | null;
  estudianteId?: number | null;
  parentesco: string;
}
