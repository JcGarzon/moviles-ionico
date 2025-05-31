import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonAccordionGroup, IonAccordion, IonItem, IonLabel, IonList, IonButton, IonIcon, IonThumbnail, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { heart, heartOutline } from 'ionicons/icons';

interface City {
  _id: string;
  name: string;
  countryId: { _id: string; name: string; code: string };
}

interface Site {
  _id: string;
  name: string;
  cityId: { _id: string; name: string };
  imageUrl?: string; // Optional image URL
}

interface FamousPerson {
  _id: string;
  name: string;
  cityId: { _id: string; name: string };
}

interface Tag {
  _id: string;
  userId: { _id: string; email: string }; // Added userId to match endpoint response
  siteId: { _id: string; name: string; imageUrl?: string };
  famousPersonId: { _id: string; name: string };
  tagDate: string;
  location: { latitude: number; longitude: number };
}

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
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
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonButton,
    IonIcon,
    IonThumbnail,
  ],
  standalone: true,
})
export class Tab5Page implements OnInit {
  favoriteSites: Site[] = [];
  tags: Tag[] = [];
  loading = true;
  error: string | null = null;

  private apiUrl = 'https://web-production-62aa.up.railway.app/api';
  readonly placeholderImage = 'https://via.placeholder.com/50'; // Fallback image

  constructor(
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {
    addIcons({ heart, heartOutline });
  }

  ngOnInit() {
    // Initialize icons
  }

  ionViewWillEnter() {
    this.loading = true;
    this.error = null;
    this.loadFavorites();
    this.fetchTags();
  }

  private loadFavorites() {
    const favorites = localStorage.getItem('favoriteSites');
    const favoriteIds = favorites ? JSON.parse(favorites) : [];
    if (favoriteIds.length > 0) {
      this.http
        .get<Site[]>(`${this.apiUrl}/sites`, { headers: this.getHeaders() })
        .toPromise()
        .then(sites => {
          this.favoriteSites = sites?.filter(site => favoriteIds.includes(site._id)) || [];
        })
        .catch(err => {
          this.error = 'Error loading favorite sites';
          console.error(err);
        })
        .finally(() => {
          this.loading = false;
        });
    } else {
      this.favoriteSites = [];
      this.loading = false;
    }
  }

  private async fetchTags() {
    try {
      const userId = this.getUserIdFromToken();
      if (!userId) {
        this.error = 'No se pudo obtener el ID del usuario';
        this.tags = [];
        await this.showToast('No se pudo obtener el ID del usuario', 'danger');
        return;
      }

      this.tags = await this.http
        .get<Tag[]>(`${this.apiUrl}/tags/by-user/${userId}`, { headers: this.getHeaders() })
        .toPromise() || [];
      console.log('User tags:', JSON.stringify(this.tags, null, 2)); // Debug: verify tags data
    } catch (err: any) {
      this.error = err.message || 'Error al cargar los tags';
      console.error('Fetch tags error:', err);
      await this.showToast('Error al cargar los tags', 'danger');
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

  isFavorite(siteId: string): boolean {
    return this.favoriteSites.some(site => site._id === siteId);
  }

  toggleFavorite(site: Site) {
    let favoriteIds = JSON.parse(localStorage.getItem('favoriteSites') || '[]');
    if (this.isFavorite(site._id)) {
      favoriteIds = favoriteIds.filter((id: string) => id !== site._id);
      this.favoriteSites = this.favoriteSites.filter(s => s._id !== site._id);
    } else {
      favoriteIds.push(site._id);
      this.favoriteSites.push(site);
    }
    localStorage.setItem('favoriteSites', JSON.stringify(favoriteIds));
    this.showToast(`Site ${this.isFavorite(site._id) ? 'added to' : 'removed from'} favorites`, 'success');
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