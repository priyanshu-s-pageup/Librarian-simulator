import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, Subject, switchMap, tap, throwError, lastValueFrom, forkJoin, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.development';
import { BookData } from './pages/user/explore-books/explore-books.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { timeout } from 'rxjs';
import { BorrowRequest } from './models/borrow-request.model';
import { NotificationSyncService } from './pages/user/user-notify/notification-sync.service';
import { AuthService } from './auth/auth.service';
import { BorrowStatus } from './models/borrow-status.enum';
// import { BorrowRequest } from './models/borrow-request.model';

interface Book{
  id?: string;
  title: string;
  author: string;
  // reRequest: 'pending' | 'approved' | 'denied';
}

export interface BorrowDialogData {
  book: BookData;
  maxDuration: number;
}

@Injectable({
  providedIn: 'root',
})
export class BorrowNotificationService {
  // private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private url = environment.apiUrl;

  book: Book = <Book>{};


  private readonly borrowRequestsSubject = new BehaviorSubject<BorrowRequest[]>([]);
  private readonly borrowedBooksSubject = new BehaviorSubject<Set<string | undefined>>(new Set());

  // Event Subjects
  private readonly borrowRequestedSubject = new Subject<BorrowRequest>();
  private readonly borrowApprovedSubject = new Subject<string | undefined>();
  private readonly borrowDeniedSubject = new Subject<string | undefined>();

  // Public Observables
  readonly borrowRequests$ = this.borrowRequestsSubject.asObservable();
  readonly borrowedBooks$ = this.borrowedBooksSubject.asObservable();
  readonly borrowRequested$ = this.borrowRequestedSubject.asObservable();
  readonly borrowApproved$ = this.borrowApprovedSubject.asObservable();
  readonly borrowDenied$ = this.borrowDeniedSubject.asObservable();

  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  constructor(private http: HttpClient, private notificationSync: NotificationSyncService, private authService: AuthService) {
    this.initialize();
  }

  private initialize(): void {
    this.loadInitialRequests();
  }

  private loadInitialRequests(): void {
    this.http
      .get<BorrowRequest[]>(`${this.url}/borrowRequests?status=pending&_expand=book&_expand=user`)
      .pipe(timeout(10000))
      .subscribe({
        next: (requests) => {
          console.log('Initial Borrow Requests:', requests); // debug check
          this.borrowRequestsSubject.next(requests);
        },
        error: (err: unknown) => {
          console.error('Error loading initial requests:', err);
          this.snackBar.open(
            'Failed to load borrow requests. Please check your connection.',
            'Close',
            this.snackBarConfig
          );
          this.borrowRequestsSubject.next([]);
        },
        complete: () => {
          console.log('Initial requests load completed'); // Debug
        }
      });
  }

applyreRequest(book: Book, userId: string | null, newDuration: number): Observable<void> {
  return this.http
    .get<BorrowRequest[]>(`${this.url}/borrowRequests?bookId=${book.id}&userId=${userId}&status=approved`)
    .pipe(
      switchMap((existingRequests) => {
        if (existingRequests.length > 0) {
          const approvedRequest = existingRequests[0];
          // Mark as re-requested
          return this.http.patch<BorrowRequest>(`${this.url}/borrowRequests/${approvedRequest.id}`, {
            reRequest: BorrowStatus.Pending,
            newDuration,
            createdAt: Date.now()
          });
        } else {
          // Optional fallback: create a new one (if none found — shouldn't usually happen)
          return this.http.post<BorrowRequest>(`${this.url}/borrowRequests`, {
            bookId: book.id,
            userId,
            newDuration,
            reRequest: BorrowStatus.Pending,
            status: BorrowStatus.Approved,
            createdAt: Date.now()
          });
        }
      }),
      switchMap((savedRequest) =>
        this.http.get<BorrowRequest>(`${this.url}/borrowRequests/${savedRequest.id}?_expand=book`)
      ),
      tap((fullRequest) => {
        const updatedRequest: BorrowRequest = {
          ...fullRequest,
          book: {
            id: book.id,
            title: book.title,
            author: book.author
          }
        };
        this.updateRequests([...this.currentRequests, updatedRequest]);
        this.borrowRequestedSubject.next(updatedRequest);
        this.snackBar.open(
          `Re-request for "${book.title}" submitted.`,
          'Close',
          this.snackBarConfig
        );
      }),
      map(() => void 0),
      catchError((err) => {
        this.snackBar.open('Failed to submit re-request.', 'Close', this.snackBarConfig);
        return throwError(() => err);
      })
    );
}


requestBorrow(book: BookData, userId: string, duration: number): Observable<void> {
  if (book.stockQuantity <= 0) {
    this.snackBar.open('Cannot borrow: Book is out of stock.', 'Close', this.snackBarConfig);
    return throwError(() => new Error('Book out of stock'));
  }

  return this.http
    .post<BorrowRequest>(`${this.url}/borrowRequests`, {
      bookId: book.id,
      userId,
      duration,
      status: 'pending',
      createdAt: Date.now()
    })
    .pipe(
      switchMap((savedRequest) =>
        this.http.get<BorrowRequest>(
          `${this.url}/borrowRequests/${savedRequest.id}?_expand=book`
        )
      ),
      tap((fullRequest) => {
        const updatedRequest: BorrowRequest = {
          ...fullRequest,
          book: {
            id: String(book.id),
            title: book.title,
            author: book.author,
            stockQuantity: book.stockQuantity,
            status: book.status
          }
        };
        this.updateRequests([...this.currentRequests, updatedRequest]);
        this.borrowRequestedSubject.next(updatedRequest);
        this.snackBar.open(
          `Borrow request for "${book.title}" submitted.`,
          'Close',
          this.snackBarConfig
        );
      }),
      map(() => void 0),
      catchError((err) => {
        this.snackBar.open('Failed to submit borrow request.', 'Close', this.snackBarConfig);
        return throwError(() => err);
      })
    );
}

approveBorrow(book: BookData,requestId: number): Observable<void> {
  const userId = this.currentUserId;
  return this.http
    .patch<void>(`${this.url}/borrowRequests/${requestId}`, { status: 'approved' })
    .pipe(
      timeout(10000),
      tap(() => {
        const request = this.currentRequests.find((req) => req.id === requestId);
        if (request) {
          this.updateRequests(this.currentRequests.filter((req) => req.id !== requestId));
          this.borrowApprovedSubject.next(request.bookId);
          this.updateBorrowedBooks(request.bookId);
          this.snackBar.open('Borrow request approved.', 'Close', this.snackBarConfig);
          this.createUserNotification(book, 'approved', userId)
        }
      }),
      catchError((err) => {
        this.snackBar.open('Failed to approve request.', 'Close', this.snackBarConfig);
        return throwError(() => err);
      })
    );
}

denyBorrow(book: BookData, requestId: number): Observable<void> {
  const userId = this.currentUserId;
  return this.http
    .patch<void>(`${this.url}/borrowRequests/${requestId}`, { status: 'denied' })
    .pipe(
      timeout(10000),
      tap(() => {
        const request = this.currentRequests.find((req) => req.id === requestId);
        if (request) {
          this.updateRequests(this.currentRequests.filter((req) => req.id !== requestId));
          this.borrowDeniedSubject.next(request.bookId);
          this.snackBar.open('Borrow request denied.', 'Close', this.snackBarConfig);
          this.createUserNotification(book, 'denied', userId);
        }
      }),
      catchError((err) => {
        this.snackBar.open('Failed to deny request.', 'Close', this.snackBarConfig);
        return throwError(() => err);
      })
    );
}

  getBorrowRequests(): Observable<BorrowRequest[]> {
    return this.http
      // .get<BorrowRequest[]>(`${this.url}/borrowRequests?reRequest=pending&_expand=book`) [remove this line]
      .get<BorrowRequest[]>(`${this.url}/borrowRequests?status=pending&_expand=book`)
      .pipe(
        timeout(10000),
        tap((requests) => {
          console.log('Fetched Borrow Requests:', requests); // Debug
        })
      );
  }

  getReIssueRequest(): Observable<BorrowRequest[]> {
    return this.http
      .get<BorrowRequest[]>(`${this.url}/borrowRequests?reRequest=pending&_expand=book`)
      // .get<BorrowRequest[]>(`${this.url}/borrowRequests?status=pending&_expand=book`)
      .pipe(
        timeout(10000),
        tap((requests) => {
          console.log('Fetched ReIssue Requests:', requests); // Debug
        })
      );
  }

  getBorrowRequestsByUser(userId: string): Observable<BorrowRequest[]> {
    return this.http.get<BorrowRequest[]>(`${this.url}?userId=${userId}&_expand=book&_expand=user`);
  }


  private get currentRequests(): BorrowRequest[] {
    return this.borrowRequestsSubject.value;
  }

  private updateRequests(requests: BorrowRequest[]): void {
    this.borrowRequestsSubject.next(requests);
  }

  private updateBorrowedBooks(bookId: string | undefined): void {
    const current = new Set(this.borrowedBooksSubject.value);
    current.add(bookId);
    this.borrowedBooksSubject.next(current);
  }

  emitBorrowDenied(bookId: string | undefined): void {
    this.borrowDeniedSubject.next(bookId);
    this.snackBar.open(
      'Borrow request denied.',
      'Close',
      this.snackBarConfig
    );
  }

  private bookStatusUpdated = new Subject<{bookId: number, status: 'available' | 'borrowed'}>();
  bookStatusUpdated$ = this.bookStatusUpdated.asObservable();

  updateBookStatus(bookId: number, status: 'available' | 'borrowed') {
    this.bookStatusUpdated.next({bookId, status});
  }

   createUserNotification(book: BookData, status: 'approved' | 'denied', userId: string | null): void {
    const newNotif = {
      // bookTitle,
      bookId: book.id,
      userId,
      status,
      isRead: false,
      hasReRequested: false
    };

    this.http.post(`${this.url}/userNotifications`, newNotif).subscribe({
      next: () => console.log('User notification created'),
      error: (err) => console.error('Failed to create user notification', err)
    });
  }

  // updateRequestStatus(requestId: string | undefined, newStatus: 'approved' | 'denied' | 'returned', message?: string) {
  //   console.log('Updating request status for bookId:', requestId);

  //   return this.http.get<any>(`${this.url}/borrowRequests?bookId=${requestId}`).pipe(
  //     switchMap((borrowRequests: any[]) => {
  //       if (borrowRequests.length === 0) {
  //         throw new Error('No borrow request found with that bookId');
  //       }

  //       const borrowRequest = borrowRequests[0]; // Assuming `bookId` is unique
  //       console.log('Found borrow request:', borrowRequest); // D
  //       const updatedRequest = {
  //         ...borrowRequest,
  //         status: newStatus,
  //         message: message ?? borrowRequest.message,
  //         reRequest: newStatus === 'returned' ? 'returned' : borrowRequest.reRequest};

  //       console.log('Updating borrow request with new status:', updatedRequest);
  //       // Now send a PATCH request to update the found request by id
  //       return this.http.patch(`${this.url}/borrowRequests/${borrowRequest.id}`, updatedRequest);
  //     }),
  //     switchMap((updatedRequest) => {
  //       console.log('Borrow request updated:', updatedRequest); // Debug log
  //       return this.notificationSync.syncBorrowRequestToNotification(updatedRequest);  // Sync notifications if needed
  //     })
  //   );
  // }

  updateRequestStatus(
    requestId: string | undefined,
    newStatus: 'approved' | 'denied' | 'returned',
    message?: string
  ) {
    if (!requestId) {
      throw new Error('Invalid request ID');
    }

    return this.http.get<any[]>(`${this.url}/borrowRequests?bookId=${requestId}`).pipe(
      switchMap((borrowRequests) => {
        if (!borrowRequests.length) throw new Error('No borrow request found');
        const borrowRequest = borrowRequests[0];

        const updatedRequest = {
          ...borrowRequest,
          status: newStatus,
          message: message ?? borrowRequest.message,
          reRequest: newStatus === BorrowStatus.Returned ? 'returned' : borrowRequest.reRequest
        };

        return this.http.patch(`${this.url}/borrowRequests/${borrowRequest.id}`, updatedRequest);
      }),
      switchMap((updatedRequest: any) => {
        return this.http.get<BorrowRequest[]>(`${this.url}/userNotifications?bookId=${requestId}`).pipe(
          switchMap((notifications) => {
            if (!notifications.length) return of(updatedRequest); // fallback

            const notificationToUpdate = notifications[0];
            const updatedNotification = {
              ...notificationToUpdate,
              status: updatedRequest.status,
              message: updatedRequest.message,
              adminComment: updatedRequest.message
            };

            return this.http.patch(`${this.url}/userNotifications/${notificationToUpdate.id}`, updatedNotification);
          }),
          switchMap((patchedNotification) => {
            return this.notificationSync.syncBorrowRequestToNotification(updatedRequest);
          })
        );
      })
    );
  }


  updateReIssueDetails(requestId: number, newDuration: number | undefined, newStatus: 'approved' | 'denied') {
    return this.http.patch(`${this.url}/borrowRequests/${requestId}`, { reRequest: newStatus, duration: newDuration}).pipe(
      switchMap(updatedRequest =>
        this.notificationSync.syncBorrowRequestToNotification(updatedRequest)
      )
    );
  }

  updateReIssueDetails2(requestId: number, newStatus: 'approved' | 'denied') {
    return this.http.patch(`${this.url}/borrowRequests/${requestId}`, { reRequest: newStatus}).pipe(
      switchMap(updatedRequest =>
        this.notificationSync.syncBorrowRequestToNotification(updatedRequest)
      )
    );
  }

}

