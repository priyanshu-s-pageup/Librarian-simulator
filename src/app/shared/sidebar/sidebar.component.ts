import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface MenuItem {
  title: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, FormsModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems = signal<MenuItem[]>([
    { title: 'Book List', route: '/book-list', icon: 'book' },
    { title: 'User List', route: '/user-list', icon: 'person' },
    { title: 'Explore Books', route: '/explore-books', icon: 'menu_book' },
    {title: 'Admin Notification', route: './app-admin-notify', icon:'book'}
  ]);

  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }
}
