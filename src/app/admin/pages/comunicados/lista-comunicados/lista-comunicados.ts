import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth';
import { ComunicadoService } from '../../../../core/services/comunicado.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import {
  Comunicado, ComunicadoRequest, GRUPOS_DESTINO, GrupoDestino, etiquetaGrupo,
} from '../../../../core/models/comunicado.model';
import { anioDe, fechaLarga, haceCuanto, iniciales, textoPlano } from '../../../../core/utils/texto';
import { EditorTexto } from '../../../../shared/components/editor-texto/editor-texto';

type FiltroLectura = 'todos' | 'leidos' | 'no-leidos';

const IMAGEN_MAX_BYTES = 2 * 1024 * 1024;

@Component({
  selector: 'app-lista-comunicados',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorTexto],
  templateUrl: './lista-comunicados.html',
})
export class ListaComunicados implements OnInit {

  readonly grupos = GRUPOS_DESTINO;
  readonly etiquetaGrupo = etiquetaGrupo;
  readonly haceCuanto = haceCuanto;
  readonly fechaLarga = fechaLarga;
  readonly textoPlano = textoPlano;
  readonly iniciales = iniciales;

  private auth = inject(AuthService);
  private comunicadoService = inject(ComunicadoService);
  private notificaciones = inject(NotificacionService);

  private usuario = this.auth.obtenerUsuario();
  /** Administrador, o Directiva con el permiso "Crear comunicados". */
  readonly esAdmin = this.auth.tienePermiso('COMUNICADOS');

  comunicados = signal<Comunicado[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = signal('');
  anio = signal<number>(new Date().getFullYear());
  filtro = signal<FiltroLectura>('todos');

  // Panel de detalle (lateral)
  detalle = signal<Comunicado | null>(null);

  // Anuncio grande (modal centrado)
  anuncioActual = signal<Comunicado | null>(null);
  private anunciosMostrados = new Set<number>();

  // Modal crear / editar
  modalAbierto = signal(false);
  editandoId = signal<number | null>(null);
  guardando = signal(false);
  errorModal = signal<string | null>(null);
  selectorGruposAbierto = signal(false);
  fTitulo = '';
  fContenido = '';
  fImagen = signal<string | null>(null);
  fAnuncio = signal(false);
  fGrupos = signal<GrupoDestino[]>([]);

  anios = computed(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    this.comunicados().forEach(c => set.add(anioDe(c.fechaCreacion)));
    return [...set].sort((a, b) => b - a);
  });

  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.comunicados().filter(c => {
      if (anioDe(c.fechaCreacion) !== this.anio()) return false;
      if (this.filtro() === 'leidos' && !c.leido) return false;
      if (this.filtro() === 'no-leidos' && c.leido) return false;
      if (!texto) return true;
      return c.titulo.toLowerCase().includes(texto)
        || textoPlano(c.contenido).toLowerCase().includes(texto)
        || c.autorNombre.toLowerCase().includes(texto);
    });
  });

  noLeidos = computed(() => this.comunicados().filter(c => !c.leido).length);

  ngOnInit(): void {
    this.cargar(true);
  }

  cargar(mostrarAnuncio = false): void {
    if (!this.usuario) return;
    this.cargando.set(true);
    this.comunicadoService.listar(this.usuario.id).subscribe({
      next: (data) => {
        this.comunicados.set(data);
        this.cargando.set(false);
        if (mostrarAnuncio) this.siguienteAnuncio();
      },
      error: () => {
        this.error.set('No se pudo conectar con el servidor.');
        this.cargando.set(false);
      },
    });
  }

  // ---------------- Anuncio grande ----------------

  /** Muestra el anuncio más reciente que el usuario todavía no ha leído. */
  private siguienteAnuncio(): void {
    const pendiente = this.comunicados().find(c => c.anuncio && !c.leido && !this.anunciosMostrados.has(c.id));
    this.anuncioActual.set(pendiente ?? null);
  }

  cerrarAnuncio(): void {
    const a = this.anuncioActual();
    if (!a) return;
    this.anunciosMostrados.add(a.id);
    this.marcarLeido(a);
    this.anuncioActual.set(null);
    // Si había más de un anuncio sin leer, aparece el siguiente.
    setTimeout(() => this.siguienteAnuncio(), 250);
  }

  // ---------------- Detalle ----------------

  abrirDetalle(c: Comunicado): void {
    this.detalle.set(c);
    this.marcarLeido(c);
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  private marcarLeido(c: Comunicado): void {
    if (c.leido || !this.usuario) return;
    this.comunicadoService.marcarLeido(c.id, this.usuario.id).subscribe({
      next: () => {
        this.comunicados.update(lista => lista.map(x => x.id === c.id ? { ...x, leido: true } : x));
        this.notificaciones.refrescar();
      },
    });
  }

  // ---------------- Crear / editar (solo administración) ----------------

  abrirCrear(): void {
    this.editandoId.set(null);
    this.fTitulo = '';
    this.fContenido = '';
    this.fImagen.set(null);
    this.fAnuncio.set(false);
    this.fGrupos.set([]);
    this.errorModal.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(c: Comunicado, ev?: Event): void {
    ev?.stopPropagation();
    this.detalle.set(null);
    this.editandoId.set(c.id);
    this.fTitulo = c.titulo;
    this.fContenido = c.contenido;
    this.fImagen.set(c.imagen);
    this.fAnuncio.set(c.anuncio);
    this.fGrupos.set([...c.destinatarios]);
    this.errorModal.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.selectorGruposAbierto.set(false);
  }

  alternarGrupo(g: GrupoDestino): void {
    this.fGrupos.update(lista => {
      if (g === 'TODOS') return lista.includes('TODOS') ? [] : ['TODOS'];
      const sinTodos = lista.filter(x => x !== 'TODOS');
      return sinTodos.includes(g) ? sinTodos.filter(x => x !== g) : [...sinTodos, g];
    });
  }

  resumenGrupos(): string {
    const g = this.fGrupos();
    if (!g.length) return 'Seleccionar grupo(s)';
    return g.map(etiquetaGrupo).join(', ');
  }

  elegirImagen(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      this.errorModal.set('El archivo debe ser una imagen (JPG, PNG...).');
      return;
    }
    if (archivo.size > IMAGEN_MAX_BYTES) {
      this.errorModal.set('La imagen no puede pesar más de 2 MB.');
      return;
    }
    const lector = new FileReader();
    // Con signals la vista se actualiza aunque esto ocurra fuera de un evento de Angular.
    lector.onload = () => this.fImagen.set(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  guardar(): void {
    if (!this.usuario) return;
    if (!this.fTitulo.trim()) { this.errorModal.set('Escribe el título del comunicado.'); return; }
    if (!this.fGrupos().length) { this.errorModal.set('Selecciona a quién va dirigido.'); return; }
    if (!textoPlano(this.fContenido)) { this.errorModal.set('Escribe el mensaje del comunicado.'); return; }

    const datos: ComunicadoRequest = {
      titulo: this.fTitulo.trim(),
      contenido: this.fContenido,
      imagen: this.fImagen(),
      anuncio: this.fAnuncio(),
      destinatarios: this.fGrupos(),
    };
    const id = this.editandoId();
    const peticion = id
      ? this.comunicadoService.actualizar(id, this.usuario.id, datos)
      : this.comunicadoService.crear(this.usuario.id, datos);

    this.guardando.set(true);
    this.errorModal.set(null);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.anio.set(new Date().getFullYear());
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'No se pudo guardar el comunicado.');
      },
    });
  }

  eliminar(c: Comunicado, ev?: Event): void {
    ev?.stopPropagation();
    if (!this.usuario) return;
    if (!confirm(`¿Eliminar el comunicado "${c.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.comunicadoService.eliminar(c.id, this.usuario.id).subscribe({
      next: () => {
        this.detalle.set(null);
        this.cargar();
        this.notificaciones.refrescar();
      },
      error: (err) => this.error.set(err?.error?.mensaje ?? 'No se pudo eliminar el comunicado.'),
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.selectorGruposAbierto()) { this.selectorGruposAbierto.set(false); return; }
    if (this.modalAbierto()) { this.cerrarModal(); return; }
    if (this.detalle()) { this.cerrarDetalle(); }
  }

  listaGrupos(c: Comunicado): string {
    return c.destinatarios.map(etiquetaGrupo).join(', ');
  }

  claseChip(activo: boolean): string {
    return activo
      ? 'bg-[#EFEAF3] text-[#4A1F52] border-[#4A1F52]/20'
      : 'bg-white text-[#241521] border-[#E3D5C4] hover:bg-[#FAF6EF]';
  }
}
