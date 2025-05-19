import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  public title: string = 'Librarian-Simulator';

  public handleLogout(): void {
    console.log('Logout initiated');

  }

}
