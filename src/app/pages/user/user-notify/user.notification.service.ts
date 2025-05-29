import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, delay, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';
import { UserNotification } from './user-notify.component';

// export interface UserNotification {
//   id: number;
//   bookTitle: string;
//   status: 'approved' | 'denied';
//   isRead: boolean;
//   hasReRequested: boolean;
//   message?: string;
// }

@Injectable({ providedIn: 'root' })
export class UserNotificationService {
  private url = environment.apiUrl;
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private notificationsSubject = new BehaviorSubject<UserNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  // getUserNotifications(): Observable<UserNotification[]> {
  //   return this.http.get<UserNotification[]>(`${this.baseUrl}/userNotifications`).pipe(
  //     tap(notifs => this.notificationsSubject.next(notifs)),
  //     catchError(err => {
  //       console.error('Failed to load notifications:', err);
  //       return throwError(() => err);
  //     })
  //   );
  // }

  getUserNotifications(userId: string | void) {
    return this.http.get<any[]>(`${this.url}/userNotifications?userId=${userId}`).pipe(
      switchMap(notifications => {
        // Get all unique book IDs from notifications
        const bookIds = [...new Set(notifications.map(n => n.bookId))];

        // Fetch all related books in one request
        return this.http.get<any[]>(`${this.url}/books?id=${bookIds.join('&id=')}`).pipe(
          map(books => {
            // Map books to notifications
            return notifications.map(notification => {
              const book = books.find(b => b.id === notification.bookId);
              return {
                ...notification,
                book: {
                  id: book?.id || '',
                  title: book?.title || 'Unknown Book',
                  author: book?.author || 'Unknown Author',
                  genre: book?.genre || 'Unknown Genre'
                },
                date: new Date(notification.date || Date.now())
              } as UserNotification;
            });
          })
        );
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
