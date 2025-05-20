import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/user.model';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatNavList } from '@angular/material/list';

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
export class SidebarComponent implements OnInit {
  role: string | null = null;
  user: User |null = null;
  visibleRoutes: any[] = [];
  userName: string | null = null;
  private userSubscription: Subscription = new Subscription();

  routes = [
    {path: '/user-list', label: 'User List', icon: 'person', roles: ['admin']},
    {path: '/book-list', label: 'Book List', icon: 'book', roles: ['admin']},
    {path: '/app-admin-notify', label: 'Admin Notification', icon: 'book', roles: ['admin']},
    {path: '/explore-books', label: 'Explore Books', icon: 'menu_book', roles: ['user']},
    {path: '/app-user-notify', label: 'User Notification', icon: 'book', roles: ['user']}
  ]

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.role = this.authService.getUserRole();
    this.visibleRoutes = this.routes.filter(route => route.roles.includes(this.role || ''));
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.role = user.role;
        this.userName = user.name;
        this.filterRoutes();
      } else {
        this.visibleRoutes = [];
        this.role = null;
        this.userName = null;
      }
    })
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe();
  }

  filterRoutes(){
    this.visibleRoutes = this.routes.filter(route => route.roles.includes(this.role || ''))
  }

  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(value => !value);
  }

  logout() {
    this.authService.logout();
  }


}
