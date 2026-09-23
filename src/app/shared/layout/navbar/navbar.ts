import { Component, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  standalone: true,
  templateUrl: './navbar.html',
})
export class Navbar {

  @Input() titulo: string = 'Inicio';
  @Input() usuarioNombre: string = 'Administrador General';
  @Input() usuarioCorreo: string = 'admin@cristonavado.edu.pe';
  @Input() notificaciones: number = 0;
  /** Pestaña a abrir al hacer clic en la campana. */
  @Input() tabNotificaciones: 'comunicados' | 'mensajes' = 'comunicados';

  menuAbierto = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get iniciales(): string {
    return this.usuarioNombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('');
  }

  /** Segmento de ruta (/home/{rolPath}/...) según el rol logeado. */
  get rolPath(): string {
    const rol = (this.authService.obtenerRol() ?? '').toLowerCase();
    if (['administrador', 'admin'].includes(rol)) return 'admin';
    if (['docente', 'profesor'].includes(rol)) return 'docente';
    if (['alumno', 'estudiante'].includes(rol)) return 'alumno';
    if (['padre', 'familiar', 'apoderado'].includes(rol)) return 'padre';
    return 'admin';
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-navbar')) {
      this.menuAbierto = false;
    }
  }

  irANotificaciones(): void {
    this.router.navigate(['/home', this.rolPath, 'comunicados'], {
      queryParams: { tab: this.tabNotificaciones },
    });
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}