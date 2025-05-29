import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { User } from './user.model';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  // currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = 'http://localhost:3000/users';
  private borrowedBooks = new Set<number>();

  currentUser$ = this.currentUserSubject = new BehaviorSubject<User | null>(
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );

  constructor(private http: HttpClient, private router: Router) {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user) {
      this.currentUserSubject.next(user);
    }
  }


  login(email: string, password: string): Observable<User | null> {
    return this.http.get<User[]>(`${this.apiUrl}?email=${email}&password=${password}`)
      .pipe(
        map(users => users[0] || null),
        tap(user => {
          if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  getUserRole(): string | null {
    return this.getCurrentUser()?.role || null;
  }

  isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }
}
