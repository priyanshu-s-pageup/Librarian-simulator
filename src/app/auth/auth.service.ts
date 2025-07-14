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
  private currentUserSubject = new BehaviorSubject<User | null>(
    JSON.parse(sessionStorage.getItem('currentUser') || 'null')
  );

  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  private apiUrl = 'http://localhost:3000/users';
  private borrowedBooks = new Set<number>(); //I don't remember where, but I know this had a meaningful purpose!

  constructor(private http: HttpClient, private router: Router) {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  public login(email: string, password: string): Observable<User | null> {
    return this.http
      .get<User[]>(`${this.apiUrl}?email=${email}&password=${password}`)
      .pipe(
        map((users) => users[0] || null),
        tap((user) => {
          if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  public logout() {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  public getCurrentUser(): User | null {
    const user = sessionStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  public getUserRole(): string | null {
    return this.getCurrentUser()?.role || null;
  }

  public isLoggedIn(): boolean {
    return !!this.getCurrentUser();
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
