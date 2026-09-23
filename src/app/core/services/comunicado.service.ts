import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comunicado, ComunicadoRequest } from '../models/comunicado.model';

@Injectable({ providedIn: 'root' })
export class ComunicadoService {
  private apiUrl = 'http://localhost:8080/api/comunicados';

  constructor(private http: HttpClient) {}

  private p(usuarioId: number): { params: HttpParams } {
    return { params: new HttpParams().set('usuarioId', usuarioId) };
  }

  listar(usuarioId: number): Observable<Comunicado[]> {
    return this.http.get<Comunicado[]>(this.apiUrl, this.p(usuarioId));
  }

  crear(usuarioId: number, datos: ComunicadoRequest): Observable<Comunicado> {
    return this.http.post<Comunicado>(this.apiUrl, datos, this.p(usuarioId));
  }

  actualizar(id: number, usuarioId: number, datos: ComunicadoRequest): Observable<Comunicado> {
    return this.http.put<Comunicado>(`${this.apiUrl}/${id}`, datos, this.p(usuarioId));
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.p(usuarioId));
  }

  marcarLeido(id: number, usuarioId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leido`, null, this.p(usuarioId));
  }
}
