import { Component, EventEmitter, OnInit, signal, Output } from '@angular/core';
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
  imports: [CommonModule, RouterModule, FormsModule, RouterLink, MatIcon],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  role: string | null = null;
  user: User| null = null;
  visibleRoutes: any[] = [];
  userName: string | null = null;
  private userSubscription: Subscription = new Subscription();

  routes = [
    {path: '/app-user-homepage', label: 'Home', icon: 'home', roles: ['user']},
    {path: '/user-list', label: 'User List', icon: 'group', roles: ['admin']},
    {path: '/book-list', label: 'Book List', icon: 'book', roles: ['admin']},
    {path: '/app-admin-notify', label: 'Borrow Requests', icon: 'sms', roles: ['admin']},
    {path: '/explore-books', label: 'Explore Books', icon: 'explore', roles: ['user']},
    {path: '/app-my-books', label: 'My Books', icon: 'menu_book', roles: ['user']},
    {path: '/app-user-notify', label: 'My Requests', icon: 'sms', roles: ['user']},
    {path: '/app-user-homepage', label: 'Settings', icon: 'settings', roles: ['user']},

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

  // toggleSidebar() {
  //   this.isCollapsed.update(value => !value);
  // }

  logout() {
    this.authService.logout();
  }

  @Output() collapsedChange = new EventEmitter<boolean>();
  public collapsed = false;

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.isCollapsed.update(value => !value);
    this.collapsedChange.emit(this.collapsed); // boolean not event
  }


}
