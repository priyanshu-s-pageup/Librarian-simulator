import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';

export interface UserNotification {
  id: number;
  bookTitle: string;
  status: 'approved' | 'denied';
  isRead: boolean;
  hasReRequested: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private notificationsSubject = new BehaviorSubject<UserNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  getUserNotifications(): Observable<UserNotification[]> {
    return this.http.get<UserNotification[]>(`${this.baseUrl}/userNotifications`).pipe(
      tap(notifs => this.notificationsSubject.next(notifs)),
      catchError(err => {
        console.error('Failed to load notifications:', err);
        return throwError(() => err);
      })
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/userNotifications/${notificationId}`, {
      isRead: true
    });
  }

  sendReRequest(notificationId: number, message: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/userNotifications/${notificationId}`, {
      hasReRequested: true,
      message
    });
  }
}
