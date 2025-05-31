import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonCard, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonThumbnail, IonBadge, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

interface Visit {
  _id: string;
  userId: { _id: string; email: string };
  siteId: {
    _id: string;
    name: string;
    imageUrl: string;
    cityId: { _id: string; name: string };
  };
  visitDate: string;
}

interface TopSite {
  siteId: string;
  siteName: string;
  cityName: string;
  visitCount: number;
  imageUrl?: string;
}

interface CountryTopSites {
  _id: string;
  countryName: string;
  sites: TopSite[];
}

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  standalone: true,
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
    IonBadge,
  ],
})
export class Tab4Page implements OnInit {
  visits: Visit[] = [];
  topSitesByCountry: CountryTopSites[] = [];
  loading = true;
  error: string | null = null;

  private apiUrl = 'https://web-production-62aa.up.railway.app/api';

  constructor(private http: HttpClient, private toastCtrl: ToastController) {}

  ngOnInit() {
    // Initial load (optional, can be removed if ionViewWillEnter is sufficient)
    this.fetchData();
  }

  ionViewWillEnter() {
    // Called every time the tab is navigated to
    this.fetchData();
  }

  private async fetchData() {
    this.loading = true;
    this.error = null;

    try {
      // Fetch user visits
      const allVisits = await this.http
        .get<Visit[]>(`${this.apiUrl}/visits`, { headers: this.getHeaders() })
        .toPromise();
      
      if (!allVisits) {
        this.visits = [];
        this.topSitesByCountry = [];
        return;
      }

      // Get current user's ID from JWT
      const userId = this.getUserIdFromToken();

      // Filter visits for the current user
      this.visits = allVisits.filter(visit => visit.userId._id === userId);

      // Fetch top sites by country
      const topSitesByCountry = await this.http
        .get<CountryTopSites[]>(`${this.apiUrl}/visits/top-sites-by-country`, { headers: this.getHeaders() })
        .toPromise();

      this.topSitesByCountry = topSitesByCountry || [];
      // Debug: Log the response to verify imageUrl presence
      console.log('Top sites by country:', JSON.stringify(this.topSitesByCountry, null, 2));
    } catch (err: any) {
      this.error = 'Error al cargar los datos';
      console.error('Fetch data error:', err);
      await this.showToast('Error al cargar los datos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || null;
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
    });
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
}