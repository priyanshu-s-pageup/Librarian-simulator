import { Routes } from '@angular/router';
import { BookListComponent } from './pages/admin/book/book-list/book-list.component';
import { BookUpsertComponent } from './pages/admin/book/book-upsert/book-upsert.component';
import { UserListComponent } from './pages/admin/user-management/user-list/user-list.component';
import { UserUpsertComponent } from './pages/admin/user-management/user-upsert/user-upsert.component';
import { ExploreBooksComponent } from './pages/user/explore-books/explore-books.component';
import { AdminNotifyComponent } from './pages/admin/admin-notify/admin-notify.component';
export const routes: Routes = [

    // {path: '', component:},

    {path:'book-list', component:BookListComponent},
    {path:'book-upsert', component:BookUpsertComponent},
    {path: 'book-upsert/:id', component: BookUpsertComponent},

    { path: 'user-list', component: UserListComponent},
    { path: 'user-upsert', component: UserUpsertComponent},
    { path: 'user-upsert/:id', component: UserUpsertComponent},
    { path: 'explore-books', component: ExploreBooksComponent },
    { path: 'app-admin-notify', component: AdminNotifyComponent},

    { path: '', redirectTo: '/book-list', pathMatch: 'full' },
];
