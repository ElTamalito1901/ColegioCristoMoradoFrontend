import { Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { Contacto, Contactos, GrupoContacto, Mensaje } from '../../../../core/models/mensaje.model';
import { anioDe, fechaLarga, haceCuanto, iniciales, textoPlano } from '../../../../core/utils/texto';
import { EditorTexto } from '../../../../shared/components/editor-texto/editor-texto';

type Bandeja = 'recibidos' | 'enviados';

interface Seleccionado {
  usuarioId: number;
  nombre: string;
  rol: string;
}

@Component({
  selector: 'app-bandeja-mensajes',
  standalone: true,
  imports: [CommonModule, FormsModule, EditorTexto],
  templateUrl: './bandeja-mensajes.html',
})
export class BandejaMensajes implements OnInit {

  private auth = inject(AuthService);
  private mensajeService = inject(MensajeService);
  private notificaciones = inject(NotificacionService);

  readonly haceCuanto = haceCuanto;
  readonly fechaLarga = fechaLarga;
  readonly textoPlano = textoPlano;
  readonly iniciales = iniciales;

  private usuario = this.auth.obtenerUsuario();

  bandeja = signal<Bandeja>('recibidos');
  recibidos = signal<Mensaje[]>([]);
  enviados = signal<Mensaje[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  busqueda = signal('');
  anio = signal<number>(new Date().getFullYear());

  detalle = signal<Mensaje | null>(null);

  // ---- Redactar ----
  modalAbierto = signal(false);
  contactos = signal<Contactos | null>(null);
  para = signal<Seleccionado[]>([]);
  textoPara = signal('');
  sugerenciasAbiertas = signal(false);
  asunto = '';
  contenido = '';
  respuestaAId: number | null = null;
  enviando = signal(false);
  errorModal = signal<string | null>(null);

  @ViewChild('inputPara') inputPara?: ElementRef<HTMLInputElement>;

  lista = computed(() => this.bandeja() === 'recibidos' ? this.recibidos() : this.enviados());

  anios = computed(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    [...this.recibidos(), ...this.enviados()].forEach(m => set.add(anioDe(m.fechaEnvio)));
    return [...set].sort((a, b) => b - a);
  });

  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.lista().filter(m => {
      if (anioDe(m.fechaEnvio) !== this.anio()) return false;
      if (!texto) return true;
      return m.asunto.toLowerCase().includes(texto)
        || textoPlano(m.contenido).toLowerCase().includes(texto)
        || m.remitente.nombre.toLowerCase().includes(texto)
        || m.destinatarios.some(d => d.nombre.toLowerCase().includes(texto));
    });
  });

  noLeidos = computed(() => this.recibidos().filter(m => !m.leido).length);

  /** Grupos y personas que coinciden con lo escrito en "Para:". */
  sugerencias = computed(() => {
    const c = this.contactos();
    if (!c) return { grupos: [] as GrupoContacto[], personas: [] as Contacto[] };
    const texto = this.textoPara().toLowerCase().trim();
    const elegidos = new Set(this.para().map(p => p.usuarioId));
    const coincide = (...campos: string[]) => !texto || campos.some(x => (x ?? '').toLowerCase().includes(texto));
    return {
      grupos: c.grupos.filter(g => coincide(g.nombre, g.descripcion)),
      personas: c.contactos.filter(p => !elegidos.has(p.usuarioId) && coincide(p.nombre, p.rol, p.detalle)).slice(0, 60),
    };
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (!this.usuario) return;
    this.cargando.set(true);
    let pendientes = 2;
    const fin = () => { if (--pendientes === 0) this.cargando.set(false); };
    this.mensajeService.recibidos(this.usuario.id).subscribe({
      next: (d) => { this.recibidos.set(d); fin(); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); fin(); },
    });
    this.mensajeService.enviados(this.usuario.id).subscribe({
      next: (d) => { this.enviados.set(d); fin(); },
      error: () => fin(),
    });
  }

  cambiarBandeja(b: Bandeja): void {
    this.bandeja.set(b);
  }

  // ---------------- Tarjetas ----------------

  /** Nombre a mostrar en la tarjeta: remitente (recibidos) o destinatarios (enviados). */
  nombreTarjeta(m: Mensaje): string {
    if (m.bandeja === 'RECIBIDO') return m.remitente.nombre;
    const primero = m.destinatarios[0]?.nombre ?? '—';
    const resto = m.destinatarios.length - 1;
    return resto > 0 ? `Para: ${primero} y ${resto} más` : `Para: ${primero}`;
  }

  vistos(m: Mensaje): number {
    return m.destinatarios.filter(d => d.leido).length;
  }

  listaDestinatarios(m: Mensaje): string {
    return m.destinatarios.map(d => d.nombre).join(', ');
  }

  abrirDetalle(m: Mensaje): void {
    this.detalle.set(m);
    if (m.bandeja === 'RECIBIDO' && !m.leido && this.usuario) {
      this.mensajeService.marcarLeido(m.id, this.usuario.id).subscribe({
        next: () => {
          this.recibidos.update(l => l.map(x => x.id === m.id ? { ...x, leido: true } : x));
          this.notificaciones.refrescar();
        },
      });
    }
  }

  cerrarDetalle(): void {
    this.detalle.set(null);
  }

  eliminar(m: Mensaje, ev?: Event): void {
    ev?.stopPropagation();
    if (!this.usuario) return;
    if (!confirm('¿Eliminar este mensaje de tu bandeja?')) return;
    this.mensajeService.eliminar(m.id, this.usuario.id).subscribe({
      next: () => {
        this.detalle.set(null);
        this.cargar();
        this.notificaciones.refrescar();
      },
      error: (err) => this.error.set(err?.error?.mensaje ?? 'No se pudo eliminar el mensaje.'),
    });
  }

  // ---------------- Redactar / responder ----------------

  abrirRedactar(): void {
    this.para.set([]);
    this.asunto = '';
    this.contenido = '';
    this.respuestaAId = null;
    this.prepararModal();
  }

  responder(m: Mensaje, ev?: Event): void {
    ev?.stopPropagation();
    this.detalle.set(null);
    const r = m.remitente;
    this.para.set(r.usuarioId ? [{ usuarioId: r.usuarioId, nombre: r.nombre, rol: r.rol }] : []);
    this.asunto = /^re:/i.test(m.asunto) ? m.asunto : `Re: ${m.asunto}`;
    this.contenido = '';
    this.respuestaAId = m.id;
    this.prepararModal();
  }

  private prepararModal(): void {
    this.textoPara.set('');
    this.errorModal.set(null);
    this.sugerenciasAbiertas.set(false);
    this.modalAbierto.set(true);
    if (!this.contactos() && this.usuario) {
      this.mensajeService.contactos(this.usuario.id).subscribe({
        next: (c) => this.contactos.set(c),
        error: () => this.errorModal.set('No se pudo cargar la lista de contactos.'),
      });
    }
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.sugerenciasAbiertas.set(false);
  }

  agregarPersona(c: Contacto): void {
    this.para.update(l => l.some(x => x.usuarioId === c.usuarioId) ? l : [...l, { usuarioId: c.usuarioId, nombre: c.nombre, rol: c.rol }]);
    this.textoPara.set('');
    this.inputPara?.nativeElement.focus();
  }

  agregarGrupo(g: GrupoContacto): void {
    const porId = new Map((this.contactos()?.contactos ?? []).map(c => [c.usuarioId, c]));
    this.para.update(l => {
      const ids = new Set(l.map(x => x.usuarioId));
      const nuevos = g.usuariosIds
        .filter(id => !ids.has(id) && porId.has(id))
        .map(id => { const c = porId.get(id)!; return { usuarioId: c.usuarioId, nombre: c.nombre, rol: c.rol }; });
      return [...l, ...nuevos];
    });
    this.textoPara.set('');
    this.sugerenciasAbiertas.set(false);
  }

  quitar(id: number): void {
    this.para.update(l => l.filter(x => x.usuarioId !== id));
  }

  /** Borrar con la tecla ← quita el último destinatario si el campo está vacío. */
  teclaPara(ev: KeyboardEvent): void {
    if (ev.key === 'Backspace' && !this.textoPara() && this.para().length) {
      this.para.update(l => l.slice(0, -1));
    }
  }

  enviar(): void {
    if (!this.usuario) return;
    if (!this.para().length) { this.errorModal.set('Elige al menos un destinatario.'); return; }
    if (!textoPlano(this.contenido)) { this.errorModal.set('Escribe el mensaje.'); return; }

    this.enviando.set(true);
    this.errorModal.set(null);
    this.mensajeService.enviar(this.usuario.id, {
      destinatariosIds: this.para().map(p => p.usuarioId),
      asunto: this.asunto.trim(),
      contenido: this.contenido,
      respuestaAId: this.respuestaAId,
    }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.cerrarModal();
        this.bandeja.set('enviados');
        this.anio.set(new Date().getFullYear());
        this.cargar();
      },
      error: (err) => {
        this.enviando.set(false);
        this.errorModal.set(err?.error?.mensaje ?? 'No se pudo enviar el mensaje.');
      },
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (this.sugerenciasAbiertas()) { this.sugerenciasAbiertas.set(false); return; }
    if (this.modalAbierto()) { this.cerrarModal(); return; }
    if (this.detalle()) { this.cerrarDetalle(); }
  }

  claseChip(activo: boolean): string {
    return activo
      ? 'bg-[#EFEAF3] text-[#4A1F52] border-[#4A1F52]/20'
      : 'bg-white text-[#241521] border-[#E3D5C4] hover:bg-[#FAF6EF]';
  }

  claseRol(rol: string): string {
    switch (rol) {
      case 'Docente': return 'bg-[#EFEAF3] text-[#4A1F52]';
      case 'Estudiante': return 'bg-[#E7F3EA] text-[#1E7A3B]';
      case 'Padre': return 'bg-[#FDF1DC] text-[#8A6A00]';
      default: return 'bg-[#F0E6D8] text-[#6B5A67]';
    }
  }
}
