import { Routes } from '@angular/router';
import { BookListComponent } from './pages/admin/book/book-list/book-list.component';
import { BookUpsertComponent } from './pages/admin/book/book-upsert/book-upsert.component';
import { UserListComponent } from './pages/admin/user-management/user-list/user-list.component';
import { UserUpsertComponent } from './pages/admin/user-management/user-upsert/user-upsert.component';
import { ExploreBooksComponent } from './pages/user/explore-books/explore-books.component';
import { AdminNotifyComponent } from './pages/admin/admin-notify/admin-notify.component';
import { LoginComponent } from './shared/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';
import { UserNotifyComponent } from './pages/user/user-notify/user-notify.component';
import { MyBooksComponent } from './pages/user/my-books/my-books.component';
import { UserHomepageComponent } from './pages/user/user-homepage/user-homepage.component';
// import { MyBooksComponent } from './pages/user/my-books/my-books.component';
// import { UserHomepageComponent } from './pages/user/user-homepage/user-homepage.component';
// import { SettingsPanelComponent } from './shared/settings-panel/settings-panel.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},

    {path:'book-list', component:BookListComponent, canActivate: [AuthGuard, RoleGuard], data: {role: 'admin'}},
    {path:'book-upsert', component:BookUpsertComponent},
    {path: 'book-upsert/:id', component: BookUpsertComponent},

    { path: 'user-list', component: UserListComponent, canActivate: [AuthGuard, RoleGuard], data: {role: 'admin'}},
    { path: 'user-upsert', component: UserUpsertComponent},
    { path: 'user-upsert/:id', component: UserUpsertComponent},
    { path: 'explore-books', component: ExploreBooksComponent, canActivate: [AuthGuard, RoleGuard], data: {role: 'user'} },
    { path: 'app-admin-notify', component: AdminNotifyComponent},
    {path: 'app-user-notify', component: UserNotifyComponent},
    { path: 'app-user-homepage', component: UserHomepageComponent, canActivate: [AuthGuard, RoleGuard], data: {role: 'user'}},

    {path: 'app-my-books', component: MyBooksComponent, canActivate: [AuthGuard, RoleGuard], data: {role: 'user'}},
    // { path: 'app-settings-panel', component: SettingsPanelComponent},

    { path: '', redirectTo: '/login', pathMatch: 'full' },
];
