import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonCard, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonThumbnail, IonIcon, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { heart, heartOutline, checkmarkCircle, checkmarkCircleOutline } from 'ionicons/icons';

interface City {
  _id: string;
  name: string;
  population: number;
  imageUrl: string;
  countryId: { _id: string; name: string; code: string };
}

interface Site {
  _id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  cityId: { _id: string; name: string };
}

interface Dish {
  _id: string;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  siteId: { _id: string; name: string };
}

interface FamousPerson {
  _id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  cityId: { _id: string; name: string };
}

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  imports: [
    CommonModule,
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
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonIcon,
  ],
  standalone: true,
})
export class Tab1Page implements OnInit {
  cities: City[] = [];
  sites: Site[] = [];
  dishes: Dish[] = [];
  famousPeople: FamousPerson[] = [];
  loading = true;
  error: string | null = null;
  private favoriteSites: string[] = [];
  private visitedSites: string[] = [];

  private apiUrl = 'https://web-production-62aa.up.railway.app/api';
  private colombiaId: string | null = null;

  constructor(private http: HttpClient, private toastCtrl: ToastController) {
    addIcons({ heart, heartOutline, checkmarkCircle, checkmarkCircleOutline });
  }

  ngOnInit() {
    // Initial load (optional, kept for compatibility)
    this.loadFavorites();
    this.loadVisitedSites();
    this.fetchColombiaData();
  }

  ionViewWillEnter() {
    // Reload data every time the tab is navigated to
    this.loadFavorites();
    this.loadVisitedSites();
    this.fetchColombiaData();
  }

  private loadFavorites() {
    const favorites = localStorage.getItem('favoriteSites');
    this.favoriteSites = favorites ? JSON.parse(favorites) : [];
  }

  isFavorite(siteId: string): boolean {
    return this.favoriteSites.includes(siteId);
  }

  toggleFavorite(site: Site) {
    if (this.isFavorite(site._id)) {
      this.favoriteSites = this.favoriteSites.filter((id) => id !== site._id);
    } else {
      this.favoriteSites.push(site._id);
    }
    localStorage.setItem('favoriteSites', JSON.stringify(this.favoriteSites));
  }

  private loadVisitedSites() {
    const visited = localStorage.getItem('visitedSites');
    this.visitedSites = visited ? JSON.parse(visited) : [];
  }

  isVisited(siteId: string): boolean {
    return this.visitedSites.includes(siteId);
  }

  async toggleVisit(site: Site) {
    if (this.isVisited(site._id)) {
      // Optionally, allow unmarking visits (not implemented here to avoid accidental removal)
      return;
    }

    try {
      const response = await this.http
        .post(`${this.apiUrl}/visits`, { siteId: site._id }, { headers: this.getHeaders() })
        .toPromise();
      this.visitedSites.push(site._id);
      localStorage.setItem('visitedSites', JSON.stringify(this.visitedSites));
      await this.showToast(`Visita a ${site.name} registrada`, 'success');
    } catch (err: any) {
      console.error('Error registering visit:', err);
      await this.showToast('Error al registrar la visita', 'danger');
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

  private async fetchColombiaData() {
    this.loading = true;
    this.error = null;

    try {
      // Step 1: Get Colombia's ID
      const countries = await this.http
        .get<{ _id: string; name: string; code: string }[]>(`${this.apiUrl}/countries`, { headers: this.getHeaders() })
        .toPromise();
      const colombia = countries?.find((c) => c.code === 'CO');
      if (!colombia) {
        throw new Error('País Colombia no encontrado');
      }
      this.colombiaId = colombia._id;

      // Step 2: Fetch Cities
      const cities = await this.http
        .get<City[]>(`${this.apiUrl}/cities`, { headers: this.getHeaders() })
        .toPromise();
      this.cities = cities?.filter((city) => city.countryId._id === this.colombiaId) || [];

      // Step 3: Fetch Sites and filter by Colombian cities
      const sites = await this.http
        .get<Site[]>(`${this.apiUrl}/sites`, { headers: this.getHeaders() })
        .toPromise();
      this.sites = sites?.filter((site) => this.cities.some((city) => city._id === site.cityId._id)) || [];

      // Step 4: Fetch Dishes and filter by sites in Colombia
      const dishes = await this.http
        .get<Dish[]>(`${this.apiUrl}/dishes`, { headers: this.getHeaders() })
        .toPromise();
      this.dishes = dishes?.filter((dish) => this.sites.some((site) => site._id === dish.siteId._id)) || [];

      // Step 5: Fetch Famous People and filter by Colombian cities
      const famousPeople = await this.http
        .get<FamousPerson[]>(`${this.apiUrl}/famousPeople`, { headers: this.getHeaders() })
        .toPromise();
      this.famousPeople = famousPeople?.filter((person) =>
        this.cities.some((city) => city._id === person.cityId._id)
      ) || [];
    } catch (err: any) {
      this.error = err.message || 'Error al cargar los datos';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}