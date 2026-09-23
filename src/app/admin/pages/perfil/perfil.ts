import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  FormsModule,
  Validators,
  FormGroup
} from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { PerfilService } from '../../../core/services/perfil.service';
import { Perfil as PerfilModel } from '../../../core/models/perfil.model';
import { etiquetaRol } from '../../../core/models/usuario.model';
import { PERMISOS } from '../../../core/models/permiso.model';
import { infoDocumento } from '../../../core/models/documento.model';

/**
 * Vista "Mi perfil". La usan los 4 roles (admin/docente/alumno/padre):
 * se enruta el mismo componente desde app.routes.ts en cada sección,
 * y aquí siempre se trabaja con el usuario logeado (AuthService).
 */
@Component({
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-perfil',
  styleUrl: './perfil.css',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {

  perfil = signal<PerfilModel | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);
  guardadoOk = signal(false);
  editando = signal(false);

  etiquetaRol = etiquetaRol;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private perfilService: PerfilService,
  ) {
    this.form = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],

      telefono: [''],

      direccion: [''],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const usuario = this.authService.obtenerUsuario();

    if (!usuario) return;

    this.cargando.set(true);

    this.perfilService.obtener(usuario.id).subscribe({
      next: (p) => {
        this.perfil.set(p);

        this.form.reset({
          nombre: p.nombre,
          telefono: p.docente?.telefono ?? p.padre?.telefono ?? p.personal?.telefono ?? '',
          direccion: p.docente?.direccion ?? p.padre?.direccion ?? '',
        });

        this.cargando.set(false);
      },

      error: () => {
        this.error.set('No se pudo cargar tu perfil.');
        this.cargando.set(false);
      },
    });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase();
  }

  // ------------------------------------------------------------------
  // Gmail: vincular / verificar con código
  // ------------------------------------------------------------------

  gmailAbierto = signal(false);
  gmailPaso = signal<'correo' | 'codigo'>('correo');
  gmailInput = signal('');
  gmailCodigo = signal('');
  gmailEnmascarado = signal('');
  gmailCodigoPrueba = signal<string | null>(null);
  gmailError = signal<string | null>(null);
  gmailOk = signal(false);
  gmailCargando = signal(false);
  segundosReenvio = signal(0);
  private temporizador?: ReturnType<typeof setInterval>;

  abrirGmail(): void {
    const p = this.perfil();
    this.gmailInput.set(p?.correo && !p.correoVerificado ? p.correo : '');
    this.gmailCodigo.set('');
    this.gmailPaso.set('correo');
    this.gmailError.set(null);
    this.gmailOk.set(false);
    this.gmailCodigoPrueba.set(null);
    this.gmailAbierto.set(true);
  }

  cancelarGmail(): void {
    this.gmailAbierto.set(false);
    this.detenerTemporizador();
  }

  enviarCodigoGmail(): void {
    const p = this.perfil();
    const correo = this.gmailInput().trim();
    if (!p) return;
    if (!/^[^\s@]+@gmail\.com$/i.test(correo)) {
      this.gmailError.set('Escribe un Gmail válido (termina en @gmail.com).');
      return;
    }
    this.gmailError.set(null);
    this.gmailCargando.set(true);
    this.perfilService.enviarCodigoCorreo(p.usuarioId, correo).subscribe({
      next: (r) => {
        this.gmailCargando.set(false);
        this.gmailEnmascarado.set(r.correoEnmascarado);
        this.gmailCodigoPrueba.set(r.codigoPrueba);
        this.gmailPaso.set('codigo');
        this.iniciarTemporizador(r.segundosParaReenviar);
      },
      error: (err) => {
        this.gmailCargando.set(false);
        this.gmailError.set(err?.error?.mensaje ?? 'No se pudo enviar el código.');
      },
    });
  }

  verificarGmail(): void {
    const p = this.perfil();
    if (!p) return;
    const codigo = this.gmailCodigo().trim();
    if (!/^\d{6}$/.test(codigo)) {
      this.gmailError.set('Escribe el código de 6 dígitos.');
      return;
    }
    this.gmailError.set(null);
    this.gmailCargando.set(true);
    this.perfilService.verificarCorreo(p.usuarioId, codigo).subscribe({
      next: (actualizado) => {
        this.gmailCargando.set(false);
        this.perfil.set(actualizado);
        this.gmailAbierto.set(false);
        this.gmailOk.set(true);
        this.detenerTemporizador();
        const usuario = this.authService.obtenerUsuario();
        if (usuario) {
          this.authService.guardarSesion({ ...usuario, correo: actualizado.correo, correoVerificado: true });
        }
      },
      error: (err) => {
        this.gmailCargando.set(false);
        this.gmailError.set(err?.error?.mensaje ?? 'No se pudo verificar el código.');
      },
    });
  }

  private iniciarTemporizador(segundos: number): void {
    this.detenerTemporizador();
    this.segundosReenvio.set(segundos);
    this.temporizador = setInterval(() => {
      const s = this.segundosReenvio() - 1;
      this.segundosReenvio.set(Math.max(0, s));
      if (s <= 0) this.detenerTemporizador();
    }, 1000);
  }

  private detenerTemporizador(): void {
    if (this.temporizador) clearInterval(this.temporizador);
    this.temporizador = undefined;
  }

  /** Nombres legibles de los permisos del panel. */
  permisosInfo(permisos: string[] | null | undefined): string[] {
    return (permisos ?? []).map(v => PERMISOS.find(x => x.valor === v)?.titulo ?? v);
  }

  /** Edad a partir de la fecha de nacimiento (AAAA-MM-DD). */
  nombreDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).nombre;
  }

  edad(fecha: string | null | undefined): number | null {
    if (!fecha) return null;
    const n = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    let e = hoy.getFullYear() - n.getFullYear();
    const m = hoy.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < n.getDate())) e--;
    return e;
  }

  /** "12 de abril de 2014" */
  fecha(f: string | null | undefined): string {
    if (!f) return '—';
    return new Date(f.length === 10 ? f + 'T00:00:00' : f)
      .toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  activarEdicion(): void {
    if (!this.perfil()?.puedeEditar) return;
    // En la Directiva el nombre (nombres + apellidos) lo cambia la administración.
    if (this.perfil()?.personal) this.form.get('nombre')?.disable();
    else this.form.get('nombre')?.enable();
    this.guardadoOk.set(false);
    this.editando.set(true);
  }

  cancelarEdicion(): void {
    this.editando.set(false);
    this.cargar();
  }

  guardar(): void {
    const p = this.perfil();

    if (!p || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    const v = this.form.value;

    this.perfilService.actualizar(p.usuarioId, {
      nombre: v.nombre,
      telefono: v.telefono || null,
      direccion: v.direccion || null,
    }).subscribe({
      next: (actualizado) => {
        this.perfil.set(actualizado);

        this.guardando.set(false);
        this.editando.set(false);
        this.guardadoOk.set(true);

        // Mantiene sincronizado el navbar
        // (nombre/correo mostrados arriba).
        const usuario = this.authService.obtenerUsuario();

        if (usuario) {
          this.authService.guardarSesion({
            ...usuario,
            nombre: actualizado.nombre,
          });
        }
      },

      error: (err) => {
        this.guardando.set(false);

        this.error.set(
          err?.error?.mensaje ??
          'No se pudo guardar tu perfil.'
        );
      },
    });
  }
}
