import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contactos, Mensaje, MensajeRequest } from '../models/mensaje.model';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private apiUrl = 'http://localhost:8080/api/mensajes';

  constructor(private http: HttpClient) {}

  private p(usuarioId: number): { params: HttpParams } {
    return { params: new HttpParams().set('usuarioId', usuarioId) };
  }

  contactos(usuarioId: number): Observable<Contactos> {
    return this.http.get<Contactos>(`${this.apiUrl}/contactos`, this.p(usuarioId));
  }

  recibidos(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/recibidos`, this.p(usuarioId));
  }

  enviados(usuarioId: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.apiUrl}/enviados`, this.p(usuarioId));
  }

  enviar(usuarioId: number, datos: MensajeRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(this.apiUrl, datos, this.p(usuarioId));
  }

  marcarLeido(id: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leido`, null, this.p(usuarioId));
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.p(usuarioId));
  }
}
