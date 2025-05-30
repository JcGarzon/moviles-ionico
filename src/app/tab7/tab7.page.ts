import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import {  IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Camera } from '@ionic-native/camera/ngx';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { addIcons } from 'ionicons';
import { camera, addCircle } from 'ionicons/icons';

interface Country {
  _id: string;
  name: string;
  code: string;
}

interface City {
  _id: string;
  name: string;
  countryId: { _id: string; name: string; code: string };
}

interface Site {
  _id: string;
  name: string;
  cityId: { _id: string; name: string };
}

interface FamousPerson {
  _id: string;
  name: string;
  cityId: { _id: string; name: string };
}

@Component({
  selector: 'app-tab7',
  templateUrl: './tab7.page.html',
  styleUrls: ['./tab7.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSpinner,
    IonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
  ],
  standalone: true,
  providers: [Camera, Geolocation],
})
export class Tab7Page implements OnInit {
  countries: Country[] = [];
  sites: Site[] = [];
  famousPeople: FamousPerson[] = [];
  filteredSites: Site[] = [];
  filteredFamousPeople: FamousPerson[] = [];
  selectedCountryId: string | null = null;
  selectedSiteId: string | null = null;
  selectedFamousPersonId: string | null = null;
  photoUrl: string | null = null;
  latitude: number | null = null;
  longitude: number | null = null;
  loading = true;
  error: string | null = null;

  private apiUrl = 'https://web-production-62aa.up.railway.app/api';

  constructor(
    private http: HttpClient,
    private camera: Camera,
    private geolocation: Geolocation,
    private toastCtrl: ToastController
  ) {
    addIcons({ addCircle });
  }

  ngOnInit() {
    this.fetchData();
    this.getCurrentLocation();
  }

  private async fetchData() {
    this.loading = true;
    this.error = null;

    try {
      // Fetch Countries
      this.countries = await this.http
        .get<Country[]>(`${this.apiUrl}/countries`, { headers: this.getHeaders() })
        .toPromise() || [];

      // Fetch Sites
      this.sites = await this.http
        .get<Site[]>(`${this.apiUrl}/sites`, { headers: this.getHeaders() })
        .toPromise() || [];

      // Fetch Famous People
      this.famousPeople = await this.http
        .get<FamousPerson[]>(`${this.apiUrl}/famousPeople`, { headers: this.getHeaders() })
        .toPromise() || [];
    } catch (err: any) {
      this.error = err.message || 'Error al cargar los datos';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }

  private async getCurrentLocation() {
    try {
      const position = await this.geolocation.getCurrentPosition();
      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;
    } catch (err: any) {
      console.error('Error getting location:', err);
      await this.showToast('No se pudo obtener la ubicación', 'danger');
    }
  }

  async takePhoto() {
    try {
      const image = await this.camera.getPicture({
        quality: 75,
        destinationType: this.camera.DestinationType.DATA_URL,
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE,
        sourceType: this.camera.PictureSourceType.CAMERA,
        correctOrientation: true,
      });
      this.photoUrl = `data:image/jpeg;base64,${image}`;
    } catch (err: any) {
      console.error('Error taking photo:', err);
      await this.showToast('Error al tomar la foto', 'danger');
    }
  }

  onCountryChange() {
    if (this.selectedCountryId) {
      // Filter sites by country
      this.http
        .get<City[]>(`${this.apiUrl}/cities`, { headers: this.getHeaders() })
        .toPromise()
        .then(cities => {
          const cityIds = cities?.filter(c => c.countryId._id === this.selectedCountryId).map(c => c._id) || [];
          this.filteredSites = this.sites.filter(s => cityIds.includes(s.cityId._id));
          this.filteredFamousPeople = this.famousPeople.filter(p => cityIds.includes(p.cityId._id));
        })
        .catch(err => {
          console.error('Error filtering data:', err);
          this.showToast('Error al filtrar sitios y personajes', 'danger');
        });
    } else {
      this.filteredSites = [];
      this.filteredFamousPeople = [];
    }
    this.selectedSiteId = null;
    this.selectedFamousPersonId = null;
  }

  isFormValid(): boolean {
    return !!this.selectedSiteId && !!this.selectedFamousPersonId && !!this.latitude && !!this.longitude;
  }

  async submitTag() {
    if (!this.isFormValid()) {
      await this.showToast('Por favor completa todos los campos', 'danger');
      return;
    }

    this.loading = true;
    try {
      const tagData = {
        siteId: this.selectedSiteId,
        famousPersonId: this.selectedFamousPersonId,
        latitude: this.latitude,
        longitude: this.longitude,
      };
      await this.http
        .post(`${this.apiUrl}/tags`, tagData, { headers: this.getHeaders() })
        .toPromise();
      await this.showToast('Tag registrado correctamente', 'success');
      // Reset form
      this.selectedCountryId = null;
      this.selectedSiteId = null;
      this.selectedFamousPersonId = null;
      this.photoUrl = null;
      this.onCountryChange();
    } catch (err: any) {
      console.error('Error submitting tag:', err);
      await this.showToast('Error al registrar el tag', 'danger');
    } finally {
      this.loading = false;
    }
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