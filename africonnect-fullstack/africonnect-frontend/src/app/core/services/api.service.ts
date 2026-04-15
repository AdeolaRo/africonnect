import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders() {
    const token = this.auth.getToken();
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  get(endpoint: string) { return this.http.get(`${this.baseUrl}/${endpoint}`, this.getHeaders()); }
  post(endpoint: string, data: any) { return this.http.post(`${this.baseUrl}/${endpoint}`, data, this.getHeaders()); }
  put(endpoint: string, data: any) { return this.http.put(`${this.baseUrl}/${endpoint}`, data, this.getHeaders()); }
  delete(endpoint: string) { return this.http.delete(`${this.baseUrl}/${endpoint}`, this.getHeaders()); }
}