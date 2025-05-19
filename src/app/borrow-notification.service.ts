import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, Subject, switchMap, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.development';
import { BookData } from './pages/user/explore-books/explore-books.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { timeout } from 'rxjs';

interface Book {
  id: number;
  title: string;
  author: string;
}

// interface BorrowRequest {
//   id: number;
//   bookId: number;
//   book: Book;
//   duration: number;
//   status: 'pending' | 'approved' | 'denied';
// }

interface BorrowRequest {
  id: number;
  bookId: number;
  book: {
    id: number;
    title: string;
    author: string;
    stockQuantity: number;
    status: 'available' | 'in-high-demand' | 'out-of-stock';
  };
  duration: number;
  status: 'pending' | 'approved' | 'denied';
}

@Injectable({
  providedIn: 'root',
})
export class BorrowNotificationService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private url = environment.apiUrl;

  // State Subjects
  private readonly borrowRequestsSubject = new BehaviorSubject<BorrowRequest[]>([]);
  private readonly borrowedBooksSubject = new BehaviorSubject<Set<number>>(new Set());

  // Event Subjects
  private readonly borrowRequestedSubject = new Subject<BorrowRequest>();
  private readonly borrowApprovedSubject = new Subject<number>();
  private readonly borrowDeniedSubject = new Subject<number>();

  // Public Observables
  readonly borrowRequests$ = this.borrowRequestsSubject.asObservable();
  readonly borrowedBooks$ = this.borrowedBooksSubject.asObservable();
  readonly borrowRequested$ = this.borrowRequestedSubject.asObservable();
  readonly borrowApproved$ = this.borrowApprovedSubject.asObservable();
  readonly borrowDenied$ = this.borrowDeniedSubject.asObservable();

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.loadInitialRequests();
  }

  private loadInitialRequests(): void {
    this.http
      .get<BorrowRequest[]>(`${this.url}/borrowRequests?status=pending&_expand=book`)
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

  // requestBorrow(book: BookData, duration: number): Observable<void> {
  //   const newRequest: BorrowRequest = {
  //     id: Date.now(), // temporary id, solves the problem of BookId
  //     bookId: book.id,
  //     book: {
  //       id: book.id,
  //       title: book.title,
  //       author: book.author
  //     },
  //     duration,
  //     status: 'pending'
  //   };

  //   return this.http
  //     .post<BorrowRequest>(`${this.url}/borrowRequests`, {
  //       bookId: book.id,
  //       duration,
  //       status: 'pending'
  //     })
  //     .pipe(
  //       tap((savedRequest) => {
  //         const updatedRequest = { ...newRequest, id: savedRequest.id }; // Use backend ID
  //         this.updateRequests([...this.currentRequests, updatedRequest]);
  //         this.borrowRequestedSubject.next(updatedRequest);
  //         this.snackBar.open(
  //           `Borrow request for "${book.title}" submitted.`,
  //           'Close',
  //           this.snackBarConfig
  //         );
  //       }),
  //       switchMap(() => new Observable<void>((subscriber) => subscriber.next()))
  //     );
  // }

requestBorrow(book: BookData, duration: number): Observable<void> {
  // Validate stock quantity upfront
  if (book.stockQuantity <= 0) {
    this.snackBar.open('Cannot borrow: Book is out of stock.', 'Close', this.snackBarConfig);
    return throwError(() => new Error('Book out of stock'));
  }

  return this.http
    .post<BorrowRequest>(`${this.url}/borrowRequests`, {
      bookId: book.id,
      duration,
      status: 'pending'
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
            id: fullRequest.book.id,
            title: fullRequest.book.title,
            author: fullRequest.book.author,
            stockQuantity: fullRequest.book.stockQuantity,
            status: fullRequest.book.status
          }
        };
        this.updateRequests([...this.currentRequests, updatedRequest]);
        this.borrowRequestedSubject.next(updatedRequest);
        this.snackBar.open(
          `Borrow request for "${fullRequest.book.title}" submitted.`,
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

  // requestBorrow(book: BookData, duration: number): Observable<void> {
  //   const newRequest: BorrowRequest = {
  //     id: Date.now(), // temporary id
  //     bookId: book.id,
  //     book: {
  //       id: book.id,
  //       title: book.title,
  //       author: book.author,
  //       stockQuantity: book.stockQuantity || 0, // Add default if not available
  //       status: book.status || 'available' // Add default if not available
  //     },
  //     duration,
  //     status: 'pending'
  //   };

  //   return this.http
  //     .post<BorrowRequest>(`${this.url}/borrowRequests`, {
  //       bookId: book.id,
  //       duration,
  //       status: 'pending'
  //     })
  //     .pipe(
  //       tap((savedRequest) => {
  //         const updatedRequest = { ...newRequest, id: savedRequest.id };
  //         this.updateRequests([...this.currentRequests, updatedRequest]);
  //         this.borrowRequestedSubject.next(updatedRequest);
  //         this.snackBar.open(
  //           `Borrow request for "${book.title}" submitted.`,
  //           'Close',
  //           this.snackBarConfig
  //         );
  //       }),
  //       switchMap(() => new Observable<void>((subscriber) => subscriber.next()))
  //     );
  // }

approveBorrow(requestId: number): Observable<void> {
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
        }
      }),
      catchError((err) => {
        this.snackBar.open('Failed to approve request.', 'Close', this.snackBarConfig);
        return throwError(() => err);
      })
    );
}

denyBorrow(requestId: number): Observable<void> {
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
      .get<BorrowRequest[]>(`${this.url}/borrowRequests?status=pending&_expand=book`)
      .pipe(
        timeout(10000),
        tap((requests) => {
          console.log('Fetched Borrow Requests:', requests); // Debug
        })
      );
  }

  private get currentRequests(): BorrowRequest[] {
    return this.borrowRequestsSubject.value;
  }

  private updateRequests(requests: BorrowRequest[]): void {
    this.borrowRequestsSubject.next(requests);
  }

  private updateBorrowedBooks(bookId: number): void {
    const current = new Set(this.borrowedBooksSubject.value);
    current.add(bookId);
    this.borrowedBooksSubject.next(current);
  }

  emitBorrowDenied(bookId: number): void {
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

}

