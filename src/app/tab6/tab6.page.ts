import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import {IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonText, IonCard, IonCardHeader, IonCardTitle, IonList, IonItem, IonLabel, IonThumbnail, IonSearchbar, IonSelect, IonSelectOption, ToastController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface Country {
  _id: string;
  name: string;
  code: string;
}

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
  selector: 'app-tab6',
  templateUrl: './tab6.page.html',
  styleUrls: ['./tab6.page.scss'],
  standalone: true,
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
    IonList,
    IonItem,
    IonLabel,
    IonThumbnail,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
  ],
})
export class Tab6Page implements OnInit {
  countries: Country[] = [];
  cities: City[] = [];
  categories: string[] = [];
  filteredSites: Site[] = [];
  filteredDishes: Dish[] = [];
  filteredFamousPeople: FamousPerson[] = [];
  searchQuery: string = '';
  selectedCountryId: string | null = null;
  selectedCityId: string | null = null;
  selectedCategory: string | null = null;
  searchType: 'site' | 'famousPerson' | null = null;
  loading = false;
  error: string | null = null;

  private apiUrl = 'https://web-production-62aa.up.railway.app/api';
  private searchSubject = new Subject<void>();

  constructor(private http: HttpClient, private toastCtrl: ToastController) {}

  ngOnInit() {
    this.fetchCountries();
    this.fetchCategories();
    this.searchSubject.pipe(debounceTime(300)).subscribe(() => this.search());
  }

  private async fetchCountries() {
    this.loading = true;
    try {
      const countries = await this.http
        .get<Country[]>(`${this.apiUrl}/countries`, { headers: this.getHeaders() })
        .toPromise();
      this.countries = countries || [];
      // Pre-select Colombia if available
      const colombia = this.countries.find(c => c.code === 'CO');
      if (colombia) {
        this.selectedCountryId = colombia._id;
        await this.fetchCities();
      }
    } catch (err: any) {
      this.error = 'Error al cargar los países';
      await this.showToast('Error al cargar los países', 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async fetchCities() {
    if (!this.selectedCountryId) {
      this.cities = [];
      return;
    }
    try {
      const cities = await this.http
        .get<City[]>(`${this.apiUrl}/cities`, { headers: this.getHeaders() })
        .toPromise();
      this.cities = cities?.filter(city => city.countryId._id === this.selectedCountryId) || [];
    } catch (err: any) {
      this.error = 'Error al cargar las ciudades';
      await this.showToast('Error al cargar las ciudades', 'danger');
    }
  }

  private async fetchCategories() {
    try {
      const famousPeople = await this.http
        .get<FamousPerson[]>(`${this.apiUrl}/famousPeople`, { headers: this.getHeaders() })
        .toPromise();
      // Extract unique categories
      this.categories = [...new Set(famousPeople?.map(person => person.category).filter(Boolean))];
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      await this.showToast('Error al cargar las categorías', 'danger');
    }
  }

  async onCountryChange() {
    this.selectedCityId = null;
    this.searchType = null;
    this.selectedCategory = null;
    this.filteredSites = [];
    this.filteredDishes = [];
    this.filteredFamousPeople = [];
    await this.fetchCities();
    this.onSearchChange();
  }

  async onCityChange() {
    this.searchType = null;
    this.selectedCategory = null;
    this.filteredSites = [];
    this.filteredDishes = [];
    this.filteredFamousPeople = [];
    this.onSearchChange();
  }

  onSearchTypeChange() {
    this.selectedCategory = null;
    this.filteredSites = [];
    this.filteredDishes = [];
    this.filteredFamousPeople = [];
    this.onSearchChange();
  }

  onSearchChange() {
    this.searchSubject.next();
  }

  private async search() {
    this.loading = true;
    this.error = null;

    try {
      // Fetch all data
      const [sites, dishes, famousPeople] = await Promise.all([
        this.http.get<Site[]>(`${this.apiUrl}/sites`, { headers: this.getHeaders() }).toPromise(),
        this.http.get<Dish[]>(`${this.apiUrl}/dishes`, { headers: this.getHeaders() }).toPromise(),
        this.http.get<FamousPerson[]>(`${this.apiUrl}/famousPeople`, { headers: this.getHeaders() }).toPromise(),
      ]);

      // Apply filters
      const query = this.searchQuery.toLowerCase().trim();

      if (this.searchType === 'site' && this.selectedCityId) {
        // Filter sites by city and query
        this.filteredSites = (sites || []).filter(site =>
          (!query || site.name.toLowerCase().includes(query)) &&
          (!this.selectedCountryId || this.cities.some(city => city._id === site.cityId._id && city.countryId._id === this.selectedCountryId)) &&
          site.cityId._id === this.selectedCityId
        );

        // Filter dishes by sites
        this.filteredDishes = (dishes || []).filter(dish =>
          (!query || dish.name.toLowerCase().includes(query)) &&
          this.filteredSites.some(site => site._id === dish.siteId._id)
        );

        this.filteredFamousPeople = [];
      } else if (this.searchType === 'famousPerson' && this.selectedCityId) {
        // Filter famous people by city, category, and query
        this.filteredFamousPeople = (famousPeople || []).filter(person =>
          (!query || person.name.toLowerCase().includes(query)) &&
          (!this.selectedCountryId || this.cities.some(city => city._id === person.cityId._id && city.countryId._id === this.selectedCountryId)) &&
          person.cityId._id === this.selectedCityId &&
          (!this.selectedCategory || person.category === this.selectedCategory)
        );

        this.filteredSites = [];
        this.filteredDishes = [];
      } else {
        // No search type selected, clear results
        this.filteredSites = [];
        this.filteredDishes = [];
        this.filteredFamousPeople = [];
      }
    } catch (err: any) {
      this.error = 'Error al realizar la búsqueda';
      console.error('Search error:', err);
      await this.showToast('Error al realizar la búsqueda', 'danger');
    } finally {
      this.loading = false;
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