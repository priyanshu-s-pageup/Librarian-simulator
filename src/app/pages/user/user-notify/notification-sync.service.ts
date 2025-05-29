import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, switchMap, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class NotificationSyncService {
  private url = environment.apiUrl;
  private notificationsUpdated = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {}

  get notificationsUpdated$() {
    return this.notificationsUpdated.asObservable();
  }

  // When borrow request status changes, create/update notification
  syncBorrowRequestToNotification(borrowRequest: any) {
    return this.http.get<any[]>(`${this.url}/userNotifications?book.title=${borrowRequest.bookId}`).pipe(
      switchMap(existingNotifications => {
        const bookTitle = this.getBookTitle(borrowRequest.bookId); // You'll need to implement this
        const newNotification = {
          bookTitle: bookTitle,
          status: borrowRequest.status,
          isRead: false,
          hasReRequested: false,
          date: new Date().toISOString()
        };

        if (existingNotifications.length > 0) {
          // Update existing notification
          const notificationId = existingNotifications[0].id;
          return this.http.patch(`${this.url}/userNotifications/${notificationId}`, newNotification);
        } else {
          // Create new notification
          return this.http.post(`${this.url}/userNotifications`, newNotification);
        }
      }),
      tap(() => this.notificationsUpdated.next())
    );
  }

  private getBookTitle(bookId: string): Promise<string> {
    return this.http.get<any>(`${this.url}/books/${bookId}`)
      .toPromise()
      .then(book => book.title)
      .catch(() => 'Unknown Book');
  }
}
