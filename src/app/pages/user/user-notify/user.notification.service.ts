import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.development';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { Book } from '../../admin/book/book.component';

export interface BorrowRequestNotification {
  id: number;
  bookId: string;
  status: 'approved' | 'denied' | 'pending' | 'returned';
  reRequest?: 'approved' | 'denied' | 'pending' | 'returned';
  hasReRequested: boolean;
  isRead: boolean;
  message?: string;
  adminComment?: string;
  book: {
    id: string;
    title: string;
    author: string;
    genre: string;
  };
  date: Date;
}

@Injectable({ providedIn: 'root' })
export class UserNotificationService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  private notificationsSubject = new BehaviorSubject<
    BorrowRequestNotification[]
  >([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  getUserNotifications(
    userId: string | undefined
  ): Observable<BorrowRequestNotification[]> {
    return this.http
      .get<BorrowRequest[]>(`${this.url}/borrowRequests?userId=${userId}`)
      .pipe(
        switchMap((requests) => {
          const bookIds = [...new Set(requests.map((r) => r.bookId))];
          const bookQuery = bookIds.map((id) => `id=${id}`).join('&');
          return this.http.get<Book[]>(`${this.url}/books?${bookQuery}`).pipe(
            map((books) =>
              requests
                .map((br) => {
                  const book = books.find((b) => b.id === String(br.bookId));
                  return {
                    id: br.id,
                    bookId: String(br.bookId),
                    status: br.status,
                    hasReRequested: br.extendedRequest?.reRequest === 'approved',
                    // isRead: br.isRead ?? false,
                    message: br.message,
                    // adminComment: br.adminComment,
                    book: {
                      id: book?.id ?? '',
                      title: book?.title ?? 'Unknown Title',
                      author: book?.author ?? 'Unknown Author',
                      genre: book?.genre ?? 'Unknown Genre',
                    },
                    date: new Date(br.createdAt),
                  } as BorrowRequestNotification;
                })
                .sort((a, b) => b.date.getTime() - a.date.getTime())
            )
          );
        })
      );
  }

  markAsRead(borrowRequestId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.url}/borrowRequests/${borrowRequestId}`,
      {
        isRead: true,
      }
    );
  }

  sendReRequest(borrowRequestId: number, message: string): Observable<void> {
    return this.http.patch<void>(
      `${this.url}/borrowRequests/${borrowRequestId}`,
      {
        reRequest: 'pending',
        message,
      }
    );
  }
}
