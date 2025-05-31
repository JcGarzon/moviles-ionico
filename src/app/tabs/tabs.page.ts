import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { triangle, ellipse, square, person, fastFood, airplane, location, heart, search, peopleCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, CommonModule],
  standalone: true,
})
export class TabsPage {
  isAdmin = false;

  constructor() {
    addIcons({ triangle, ellipse, square, person, fastFood, airplane, location, heart, search, peopleCircleOutline });
    this.checkAdmin(); // Added
  }

  private checkAdmin() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.isAdmin = decoded.role === 'Admin';
        console.log('Decoded JWT:', decoded, 'isAdmin:', this.isAdmin); // Debug
      } catch (err) {
        console.error('Error decoding token:', err);
      }
    }
  }
}