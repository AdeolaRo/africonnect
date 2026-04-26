import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../config/app.config';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = API_BASE_URL;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(includeAuth = true) {
    let headers = new HttpHeaders();
    if (includeAuth) {
      const token = this.auth.getToken();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return { headers };
  }

  get(endpoint: string, includeAuth = true) { 
    return this.http.get(`${this.baseUrl}/${endpoint}`, this.getHeaders(includeAuth)); 
  }

  getText(endpoint: string, includeAuth = true) {
    const opts = { ...this.getHeaders(includeAuth), responseType: 'text' as const };
    return this.http.get(`${this.baseUrl}/${endpoint}`, opts);
  }
  
  post(endpoint: string, data: any, includeAuth = true) { 
    return this.http.post(`${this.baseUrl}/${endpoint}`, data, this.getHeaders(includeAuth)); 
  }
  
  put(endpoint: string, data: any, includeAuth = true) { 
    return this.http.put(`${this.baseUrl}/${endpoint}`, data, this.getHeaders(includeAuth)); 
  }
  
  patch(endpoint: string, data: any, includeAuth = true) { 
    return this.http.patch(`${this.baseUrl}/${endpoint}`, data, this.getHeaders(includeAuth)); 
  }
  
  delete(endpoint: string, includeAuth = true) { 
    return this.http.delete(`${this.baseUrl}/${endpoint}`, this.getHeaders(includeAuth)); 
  }

  getBaseUrl() {
    return this.baseUrl;
  }
}