import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstudianteService } from '../../../../core/services/estudiante.service';
import { PadreService } from '../../../../core/services/padre.service';
import { ESTADOS_ESTUDIANTE, Estudiante, GRADOS, SECCIONES } from '../../../../core/models/estudiante.model';
import { PadreFamilia } from '../../../../core/models/padre.model';
import { PREFIJO_USUARIO, usuarioConDni } from '../../../../core/models/usuario.model';
import { TIPOS_DOCUMENTO, infoDocumento, limpiarDocumento, validadorDocumento } from '../../../../core/models/documento.model';
import { CampoPassword } from '../../../../shared/components/campo-password/campo-password';

type Pestana = 'general' | 'padres' | 'historial';

@Component({
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CampoPassword],
  selector: 'app-students',
  styleUrl: './students.css',
  templateUrl: './students.html',
})
export class Students implements OnInit {

  grados = GRADOS;
  secciones = SECCIONES;
  estadosPosibles = ESTADOS_ESTUDIANTE;

  estudiantes = signal<Estudiante[]>([]);
  padresDisponibles = signal<PadreFamilia[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);
  guardando = signal(false);

  busqueda = signal('');
  filtroGrado = signal('');
  filtroSeccion = signal('');
  filtroEstado = signal('');

  paginaActual = signal(1);
  porPagina = 10;

  panelVerAbierto = signal(false);
  panelEditarAbierto = signal(false);
  estudianteSeleccionado = signal<Estudiante | null>(null);
  pestanaActiva = signal<Pestana>('general');

  filtrados = computed(() => {
    const texto = this.busqueda().toLowerCase().trim();
    return this.estudiantes().filter(e => {
      const coincideTexto = !texto ||
        e.nombreCompleto.toLowerCase().includes(texto) ||
        e.dni.toLowerCase().includes(texto) ||
        (e.usuario ?? '').toLowerCase().includes(texto) ||
        (e.correo ?? '').toLowerCase().includes(texto);
      const coincideGrado = !this.filtroGrado() || e.grado === this.filtroGrado();
      const coincideSeccion = !this.filtroSeccion() || e.seccion === this.filtroSeccion();
      const coincideEstado = !this.filtroEstado() || e.estado === this.filtroEstado();
      return coincideTexto && coincideGrado && coincideSeccion && coincideEstado;
    });
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / this.porPagina)));

  paginaDatos = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina;
    return this.filtrados().slice(inicio, inicio + this.porPagina);
  });

  form!: ReturnType<FormBuilder['group']>;

  constructor(
    private fb: FormBuilder,
    private estudianteService: EstudianteService,
    private padreService: PadreService,
  ) {
    this.form = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['DNI', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: [''],
      genero: [''],
      nacionalidad: ['Peruana'],
      direccion: [''],
      telefono: [''],
      grado: ['', Validators.required],
      seccion: ['', Validators.required],
      anioIngreso: [new Date().getFullYear()],
      estado: ['Activo', Validators.required],
      // Cuenta de acceso: usuario ALU + DNI (automático) y contraseña
      password: ['', [Validators.minLength(4)]],
      confirmarPassword: [''],
    }, { validators: validadorDocumento() });
  }

  readonly tiposDocumento = TIPOS_DOCUMENTO;
  readonly hoy = new Date().toISOString().slice(0, 10);

  /** Datos del tipo de documento elegido (maxlength, placeholder). */
  infoDoc() {
    return infoDocumento(this.form.get('tipoDocumento')?.value);
  }

  /** Mensaje de error del documento, solo cuando ya se escribió algo en el número. */
  errorDoc(): string | null {
    const c = this.form.get('dni');
    if (!c || !(c.touched || c.dirty)) return null;
    return this.form.errors?.['documento'] ?? null;
  }

  etiquetaDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).corto;
  }

  nombreDoc(tipo: string | null | undefined): string {
    return infoDocumento(tipo).nombre;
  }

  /** Vista previa del usuario que tendrá el alumno: ALU + DNI. */
  usuarioPreview(): string {
    return usuarioConDni(PREFIJO_USUARIO.ALUMNO, this.form.get('dni')?.value);
  }

  /** true si el formulario abierto es de un alumno que ya tiene cuenta. */
  tieneCuenta(): boolean {
    return !!this.estudianteSeleccionado()?.usuarioId;
  }

  campoInvalido(nombre: string): boolean {
    const c = this.form.get(nombre);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  ngOnInit(): void {
    this.cargar();
    this.padreService.listar().subscribe({ next: (p) => this.padresDisponibles.set(p) });
  }

  cargar(): void {
    this.cargando.set(true);
    this.estudianteService.listar().subscribe({
      next: (data) => { this.estudiantes.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo conectar con el servidor.'); this.cargando.set(false); },
    });
  }

  iniciales(nombre: string): string {
    return nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase();
  }

  edad(fechaNacimiento: string | null): number | null {
    if (!fechaNacimiento) return null;
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  claseEstado(estado: string): string {
    switch (estado) {
      case 'Activo': return 'bg-[#E7F3EA] text-[#1E7A3B]';
      case 'En proceso': return 'bg-[#FDF1DC] text-[#B08900]';
      case 'Inactivo': return 'bg-[#FBE7E9] text-[#A62639]';
      default: return 'bg-[#EFEAF3] text-[#4A1F52]';
    }
  }

  abrirCrear(): void {
    this.estudianteSeleccionado.set(null);
    this.form.reset({
      nombreCompleto: '', tipoDocumento: 'DNI', dni: '', fechaNacimiento: '', genero: '', nacionalidad: 'Peruana',
      direccion: '', telefono: '', grado: '', seccion: '', anioIngreso: new Date().getFullYear(), estado: 'Activo',
      password: '', confirmarPassword: '',
    });
    this.error.set(null);
    this.panelEditarAbierto.set(true);
  }

  abrirVer(e: Estudiante): void {
    this.estudianteSeleccionado.set(e);
    this.pestanaActiva.set('general');
    this.panelVerAbierto.set(true);
  }

  abrirEditarDesdeVista(): void {
    const e = this.estudianteSeleccionado();
    if (!e) return;
    this.form.reset({
      nombreCompleto: e.nombreCompleto, tipoDocumento: e.tipoDocumento ?? 'DNI', dni: e.dni, fechaNacimiento: e.fechaNacimiento ?? '',
      genero: e.genero ?? '', nacionalidad: e.nacionalidad ?? 'Peruana', direccion: e.direccion ?? '',
      telefono: e.telefono ?? '', grado: e.grado, seccion: e.seccion,
      anioIngreso: e.anioIngreso ?? new Date().getFullYear(), estado: e.estado,
      password: '', confirmarPassword: '',
    });
    this.error.set(null);
    this.panelVerAbierto.set(false);
    this.panelEditarAbierto.set(true);
  }

  cerrarPaneles(): void {
    this.panelVerAbierto.set(false);
    this.panelEditarAbierto.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    if (v.password && v.password !== v.confirmarPassword) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.guardando.set(true);
    this.error.set(null);
    const payload = {
      nombreCompleto: v.nombreCompleto!,
      tipoDocumento: v.tipoDocumento!,
      dni: limpiarDocumento(v.dni),
      fechaNacimiento: v.fechaNacimiento || null,
      genero: v.genero || null,
      nacionalidad: v.nacionalidad || null,
      direccion: v.direccion || null,
      telefono: v.telefono || null,
      grado: v.grado!,
      seccion: v.seccion!,
      anioIngreso: v.anioIngreso ?? null,
      estado: v.estado!,
      // Al crear: vacío = su DNI. Al editar: vacío = no cambiar.
      password: v.password || null,
    };

    const seleccionado = this.estudianteSeleccionado();
    const peticion = seleccionado
      ? this.estudianteService.actualizar(seleccionado.id, payload)
      : this.estudianteService.crear(payload);

    peticion.subscribe({
      next: () => { this.guardando.set(false); this.cerrarPaneles(); this.cargar(); },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.mensaje ?? 'Ocurrió un error al guardar el estudiante.');
      },
    });
  }

  /** Botón "Desactivar/Activar cuenta" (tabla y panel Ver). Inactivo = no puede iniciar sesión. */
  alternarEstado(x: Estudiante): void {
    const activar = x.estado === 'Inactivo';
    if (!activar && !confirm(`¿Desactivar la cuenta de "${x.nombreCompleto}"? No podrá iniciar sesión hasta que la actives de nuevo.`)) return;
    this.error.set(null);
    this.estudianteService.cambiarEstado(x.id, activar).subscribe({
      next: () => { this.cerrarPaneles(); this.cargar(); },
      error: (err) => this.error.set(err?.error?.mensaje ?? 'No se pudo cambiar el estado de la cuenta.'),
    });
  }

  irAPagina(n: number): void {
    if (n < 1 || n > this.totalPaginas()) return;
    this.paginaActual.set(n);
  }
}
