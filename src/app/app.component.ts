import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { AuthService } from './auth/auth.service';
import { CommonModule } from '@angular/common';
// import { SettingsPanelComponent } from './shared/settings-panel/settings-panel.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  public title: string = 'Librarian-Simulator';
  public sidebarCollapsed = false;
  public layout: string = 'dark';
  public sidebarColor: string = 'dark';

  onLayoutChange(newLayout: string){
    this.layout = newLayout;
  }

  onSidebarColorChange(newColor: string){
    this.sidebarColor = newColor;
  }


  constructor(private authService: AuthService) {
    const user = authService.getCurrentUser();
    // if (user) {
    //   authService.currentUser$.next(user);
    // }
  }


  public handleLogout(): void {
    console.log('Logout initiated');

  }


  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

}
