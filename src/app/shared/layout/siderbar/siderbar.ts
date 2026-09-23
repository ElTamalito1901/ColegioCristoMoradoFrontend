import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

/** Un enlace simple del menú (sin subitems). */
export interface SidebarLink {
  type: 'link';
  id: string;
  label: string;
  route: string[]; // comandos completos para routerLink, ej: ['/home','admin','inicio']
  icon: string;     // path del SVG (24x24)
  /** Permiso necesario para verlo (Directiva). Sin permiso = visible para todos. */
  permiso?: string;
}

/** Un grupo desplegable con subitems. */
export interface SidebarGroup {
  type: 'group';
  id: string;
  label: string;
  icon: string;
  /** Permiso necesario para ver el grupo (Directiva). */
  permiso?: string;
  children: {
    id: string;
    label: string;
    route: string[];
  }[];
}

export type SidebarEntry = SidebarLink | SidebarGroup;

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive],
  selector: 'app-siderbar',
  styleUrl: './siderbar.css',
  standalone: true,
  templateUrl: './siderbar.html',
})
export class Siderbar implements OnChanges {

  /** Rol mostrado en el badge inferior. */
  @Input() rol: string = '';

  /** Estructura del menú: la define cada layout de rol (admin, docente, etc). */
  @Input() items: SidebarEntry[] = [];

  /** ids de los grupos actualmente abiertos */
  gruposAbiertos = new Set<string>();

  constructor(private router: Router) {}

  ngOnChanges(): void {
    // Abre automáticamente el grupo que contiene la ruta activa,
    // así al recargar la página el submenú correcto ya se ve desplegado.
    const url = this.router.url;
    for (const item of this.items) {
      if (item.type === 'group') {
        const tieneActivo = item.children.some(
          (child) => url.includes(child.route.join('/'))
        );
        if (tieneActivo) {
          this.gruposAbiertos.add(item.id);
        }
      }
    }
  }

  esGrupo(item: SidebarEntry): item is SidebarGroup {
    return item.type === 'group';
  }

  grupoAbierto(id: string): boolean {
    return this.gruposAbiertos.has(id);
  }

  toggleGrupo(id: string): void {
    if (this.gruposAbiertos.has(id)) {
      this.gruposAbiertos.delete(id);
    } else {
      this.gruposAbiertos.add(id);
    }
  }
}
