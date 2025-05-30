import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonButton, IonContent, IonHeader, IonLabel, IonText, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule], // Added HttpClientModule, removed HttpClient
  standalone: true,
})
export class LoginPage {
  email = '';
  password = '';
  name = '';
  role: 'Admin' | 'Common' = 'Common'; // Valor por defecto

  modoRegistro = false;

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http
      .post<any>('https://web-production-62aa.up.railway.app/api/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (resp) => {
          localStorage.setItem('token', resp.token);
          this.router.navigateByUrl('/tabs');
        },
        error: () => {
          alert('Login incorrecto');
        },
      });
  }

  registrar() {
    const data = {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
    };

    this.http
      .post<any>('https://web-production-62aa.up.railway.app/api/auth/register', data)
      .subscribe({
        next: () => {
          alert('Usuario registrado. Ahora puedes iniciar sesión.');
          this.modoRegistro = false;
        },
        error: (err) => {
          console.error(err);
          if (err.error?.errors) {
            const errores = err.error.errors.map((e: any) => `- ${e.msg}`).join('\n');
            alert(`Errores al registrar:\n${errores}`);
          } else {
            alert('Error al registrar usuario');
          }
        },
      });
  }

  toggleModo() {
    this.modoRegistro = !this.modoRegistro;
  }
}