import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea, IonButton, IonSpinner, IonText, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {jwtDecode} from 'jwt-decode';

interface City {
  _id: string;
  name: string;
  countryId: { _id: string; name: string; code: string };
}

interface SiteForm {
  name: string;
  cityId: string;
  type: string;
  description: string;
  imageUrl: string;
}

@Component({
  selector: 'app-tab8',
  templateUrl: './tab8.page.html',
  styleUrls: ['./tab8.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonSpinner,
    IonText,
  ],
  standalone: true,
})
export class Tab8Page implements OnInit {
  isAdmin = false;
  cities: City[] = [];
  siteTypes = [
    'Museo', 'Iglesia', 'Sitio Histórico', 'Castillo', 'Parque', 'Teatro', 'Plaza',
    'Sitio Arqueológico', 'Monumento', 'Sitio Religioso', 'Zona Costera', 'Evento',
    'Zona Natural', 'Edificio Gubernamental', 'Puente'
  ];
  siteForm: SiteForm = {
    name: '',
    cityId: '',
    type: '',
    description: '',
    imageUrl: ''
  };
  loading = true;
  error: string | null = null;

  private apiUrl = 'https://web-production-62aa.up.railway.app/api';

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.checkAdmin();
    this.fetchCities();
  }

  private checkAdmin() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.isAdmin = decoded.role === 'Admin';
      } catch (err) {
        console.error('Error decoding token:', err);
        this.isAdmin = false;
      }
    }
  }

  private async fetchCities() {
    try {
      this.cities = await this.http
        .get<City[]>(`${this.apiUrl}/cities`, { headers: this.getHeaders() })
        .toPromise() || [];
    } catch (err: any) {
      this.error = err.message || 'Error loading cities';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  async submitSite() {
    if (!this.isFormValid()) {
      await this.showToast('Please complete all required fields', 'danger');
      return;
    }

    this.loading = true;
    try {
      await this.http
        .post(`${this.apiUrl}/sites`, this.siteForm, { headers: this.getHeaders() })
        .toPromise();
      await this.showToast('Site added successfully', 'success');
      this.resetForm();
    } catch (err: any) {
      this.error = err.message || 'Error adding site';
      await this.showToast('Error adding site', 'danger');
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  isFormValid(): boolean {
    return !!this.siteForm.name && !!this.siteForm.cityId && !!this.siteForm.type && !!this.siteForm.description;
  }

  private resetForm() {
    this.siteForm = {
      name: '',
      cityId: '',
      type: '',
      description: '',
      imageUrl: ''
    };
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
  }
}