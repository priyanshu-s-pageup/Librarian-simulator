import { Injectable, inject, signal } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  Subject,
  switchMap,
  tap,
  throwError,
  lastValueFrom,
  forkJoin,
  of,
  EMPTY,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.development';
import { BookData } from './pages/user/explore-books/explore-books.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { timeout } from 'rxjs';
import { BorrowRequest } from './models/borrow-request.model';
import { NotificationSyncService } from './pages/user/user-notify/notification-sync.service';
import { AuthService } from './auth/auth.service';
import { BorrowStatus } from './models/borrow-status.enum';
import { ExtendedRequest } from './models/extended-request.model';
// import { BorrowRequest } from './models/borrow-request.model';

interface Book {
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

  private readonly borrowRequestsSubject = new BehaviorSubject<BorrowRequest[]>(
    []
  );
  private readonly borrowedBooksSubject = new BehaviorSubject<
    Set<string | undefined>
  >(new Set());

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
  public borrowRequests = signal<BorrowRequest[]>([]);
  public currentDate = new Date();
  public currentDeadline = new Date();

  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  constructor(
    private http: HttpClient,
    private notificationSync: NotificationSyncService,
    private authService: AuthService
  ) {
    this.initialize();
  }

  private initialize(): void {
    this.loadInitialRequests();
  }

  private loadInitialRequests(): void {
    this.http
      .get<BorrowRequest[]>(
        `${this.url}/borrowRequests?status=pending&_expand=book&_expand=user`
      )
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
        },
      });
  }

  // public applyreRequest(
  //   book: Book,
  //   userId: string | null,
  //   newDuration: number,
  //   newDeadline: Date
  // ): Observable<void> {
  //   console.log('Yes its my work: ApplyreRequest');

  //   return this.http
  //     .get<BorrowRequest[]>(
  //       `${this.url}/borrowRequests?bookId=${book.id}&userId=${userId}&status=approved`
  //     )
  //     .pipe(
  //       switchMap((existingRequests) => {
  //         if (existingRequests.length > 0) {
  //           const approvedRequest =
  //             existingRequests[existingRequests.length - 1];

  //           const extendedRequestPayload = {
  //             reIssueId: approvedRequest.id, // Generate a new reIssueId or use a UUID
  //             bookId: approvedRequest.bookId,
  //             userId: userId,
  //             reRequest: BorrowStatus.Pending, // Pending as default status
  //             newDuration,
  //             newDeadline,
  //             timeLeft: this.calculateTimeLeft(newDeadline), // Calculate timeLeft based on the new deadline
  //             reIssueMessage: '', // You can pass the message if needed
  //           };

  //           // Create a new ExtendedRequest entry
  //           return this.http.post(
  //             `${this.url}/extendedRequests`,
  //             extendedRequestPayload
  //           );
  //         } else {
  //           return this.http.post<BorrowRequest>(`${this.url}/borrowRequests`, {
  //             bookId: book.id,
  //             userId,
  //             newDuration,
  //             newDeadline,
  //             reRequest: BorrowStatus.Pending,
  //             status: BorrowStatus.Approved,
  //           });
  //         }
  //       }),
  //       switchMap((existingRequests) =>
  //         this.http.get<BorrowRequest>(
  //           `${this.url}/borrowRequests/${existingRequests.id}?_expand=book`
  //         )
  //       ),
  //       tap((fullRequest) => {
  //         const updatedRequest: BorrowRequest = {
  //           ...fullRequest,
  //           book: {
  //             id: book.id,
  //             title: book.title,
  //             author: book.author,
  //           },
  //         };

  //         const formattedDeadline = updatedRequest.extendedRequest?.newDeadline
  //           ? new Intl.DateTimeFormat('en-US', {
  //               year: 'numeric',
  //               month: 'long',
  //               day: 'numeric',
  //             }).format(new Date(updatedRequest.extendedRequest?.newDeadline))
  //           : 'unknown date';

  //         this.updateRequests([...this.currentRequests, updatedRequest]);
  //         this.borrowRequestedSubject.next(updatedRequest);

  //         this.snackBar.open(
  //           `Re-request for "${book.title}" submitted. New deadline: ${formattedDeadline}.`,
  //           'Close',
  //           this.snackBarConfig
  //         );
  //       }),

  //       map(() => void 0),
  //       catchError((err) => {
  //         this.snackBar.open(
  //           'Failed to submit re-request.',
  //           'Close',
  //           this.snackBarConfig
  //         );
  //         return throwError(() => err);
  //       })
  //     );
  // }

  public applyreRequest(
    book: Book,
    userId: string | null,
    newDuration: number,
    newDeadline: Date
  ): Observable<void> {
    console.log('Applying re-request for book:', book.id);

    // First, check if there's an existing borrow request for this book and user
    return this.http
      .get<BorrowRequest[]>(
        `${this.url}/borrowRequests?bookId=${book.id}&userId=${userId}&status=approved`
      )
      .pipe(
        // Check if we found any approved requests
        switchMap((existingRequests) => {
          if (existingRequests.length === 0) {
            throw new Error(
              'No approved borrow request found for this book and user'
            );
          }

          // Get the most recent approved request
          const approvedRequest = existingRequests[existingRequests.length - 1];

          // Create the extended request payload
          const extendedRequestPayload: ExtendedRequest = {
            id: undefined,
            reIssueId: String(approvedRequest.id),
            bookId: approvedRequest.bookId,
            userId: userId || '',
            reRequest: BorrowStatus.Pending,
            newDuration,
            newDeadline: newDeadline,
            timeLeft: this.calculateTimeLeft(newDeadline),
            reIssueMessage: '',
            book
          };

          // Post the new extended request
          return this.http.post<ExtendedRequest>(
            `${this.url}/extendedRequests`,
            extendedRequestPayload
          );
        }),
        // Handle success
        tap(() => {
          this.snackBar.open(
            `Re-request for "${
              book.title
            }" submitted successfully. New deadline: ${newDeadline.toDateString()}`,
            'Close',
            this.snackBarConfig
          );
        }),
        // Handle errors
        catchError((err) => {
          console.error('Error submitting re-request:', err);
          this.snackBar.open(
            `Failed to submit re-request: ${err.message}`,
            'Close',
            this.snackBarConfig
          );
          return throwError(() => err);
        }),
        // Return void as the final result
        map(() => void 0)
      );
  }

  public calculateTimeLeft(newDeadline: Date): number {
    const now = new Date();
    const deadline = new Date(newDeadline);

    // Ensure that the deadline is in the future
    if (deadline < now) {
      return 0; // If the deadline has passed, return 0
    }

    // Calculate the difference between the deadline and now in milliseconds
    const timeDiff = deadline.getTime() - now.getTime();

    // Convert the difference from milliseconds to days (by dividing by the number of milliseconds in a day)
    const timeLeftInDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return timeLeftInDays;
  }

  // public applyreRequest(
  //   book: Book,
  //   userId: string | null,
  //   newDuration: number,
  //   newDeadline: Date
  // ): Observable<void> {
  //   console.log('Yes its my work: ApplyreRequest');
  //   return this.http
  //     .get<BorrowRequest[]>(
  //       `${this.url}/borrowRequests?bookId=${book.id}&userId=${userId}&status=approved`
  //     )
  //     .pipe(
  //       switchMap((existingRequests) => {
  //         if (existingRequests.length > 0) {
  //           const approvedRequest = existingRequests[0];
  //           return this.http.patch<BorrowRequest>(
  //             `${this.url}/borrowRequests/${approvedRequest.id}`,
  //             {
  //               reRequest: BorrowStatus.Pending,
  //               newDuration,
  //               newDeadline,
  //             }
  //           );
  //         } else {
  //           return this.http.post<BorrowRequest>(`${this.url}/borrowRequests`, {
  //             bookId: book.id,
  //             userId,
  //             newDuration,
  //             newDeadline,
  //             reRequest: BorrowStatus.Pending,
  //             status: BorrowStatus.Approved,
  //           });
  //         }
  //       }),
  //       switchMap((savedRequest) =>
  //         this.http.get<BorrowRequest>(
  //           `${this.url}/borrowRequests/${savedRequest.id}?_expand=book`
  //         )
  //       ),
  //       tap((fullRequest) => {
  //         const updatedRequest: BorrowRequest = {
  //           ...fullRequest,
  //           book: {
  //             id: book.id,
  //             title: book.title,
  //             author: book.author,
  //           },
  //         };

  //         const formattedDeadline = updatedRequest.extendedRequest?.newDeadline
  //           ? new Intl.DateTimeFormat('en-US', {
  //               year: 'numeric',
  //               month: 'long',
  //               day: 'numeric',
  //             }).format(new Date(updatedRequest.extendedRequest?.newDeadline))
  //           : 'unknown date';

  //         this.updateRequests([...this.currentRequests, updatedRequest]);
  //         this.borrowRequestedSubject.next(updatedRequest);

  //         this.snackBar.open(
  //           `Re-request for "${book.title}" submitted. New deadline: ${formattedDeadline}.`,
  //           'Close',
  //           this.snackBarConfig
  //         );
  //       }),

  //       map(() => void 0),
  //       catchError((err) => {
  //         this.snackBar.open(
  //           'Failed to submit re-request.',
  //           'Close',
  //           this.snackBarConfig
  //         );
  //         return throwError(() => err);
  //       })
  //     );
  // }

  public requestBorrow(
    book: BookData,
    userId: string,
    duration: number
  ): Observable<void> {
    if (book.stockQuantity <= 0) {
      this.snackBar.open(
        'Cannot borrow: Book is out of stock.',
        'Close',
        this.snackBarConfig
      );
      return throwError(() => new Error('Book out of stock'));
    }

    return this.http
      .post<BorrowRequest>(`${this.url}/borrowRequests`, {
        bookId: book.id,
        userId,
        duration,
        status: 'pending',
        createdAt: Date.now(),
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
              status: book.status,
            },
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
          this.snackBar.open(
            'Failed to submit borrow request.',
            'Close',
            this.snackBarConfig
          );
          return throwError(() => err);
        })
      );
  }

  approveBorrow(book: BookData, requestId: number): Observable<void> {
    const userId = this.currentUserId;
    return this.http
      .patch<void>(`${this.url}/borrowRequests/${requestId}`, {
        status: 'approved',
      })
      .pipe(
        timeout(10000),
        tap(() => {
          const request = this.currentRequests.find(
            (req) => req.id === requestId
          );
          if (request) {
            this.updateRequests(
              this.currentRequests.filter((req) => req.id !== requestId)
            );
            this.borrowApprovedSubject.next(request.bookId);
            this.updateBorrowedBooks(request.bookId);
            this.snackBar.open(
              'Borrow request approved.',
              'Close',
              this.snackBarConfig
            );
            this.createUserNotification(book, 'approved', userId);
          }
        }),
        catchError((err) => {
          this.snackBar.open(
            'Failed to approve request.',
            'Close',
            this.snackBarConfig
          );
          return throwError(() => err);
        })
      );
  }

  denyBorrow(book: BookData, requestId: number): Observable<void> {
    const userId = this.currentUserId;
    return this.http
      .patch<void>(`${this.url}/borrowRequests/${requestId}`, {
        status: 'denied',
      })
      .pipe(
        timeout(10000),
        tap(() => {
          const request = this.currentRequests.find(
            (req) => req.id === requestId
          );
          if (request) {
            this.updateRequests(
              this.currentRequests.filter((req) => req.id !== requestId)
            );
            this.borrowDeniedSubject.next(request.bookId);
            this.snackBar.open(
              'Borrow request denied.',
              'Close',
              this.snackBarConfig
            );
            this.createUserNotification(book, 'denied', userId);
          }
        }),
        catchError((err) => {
          this.snackBar.open(
            'Failed to deny request.',
            'Close',
            this.snackBarConfig
          );
          return throwError(() => err);
        })
      );
  }

  getBorrowRequests(): Observable<BorrowRequest[]> {
    return (
      this.http
        .get<BorrowRequest[]>(
          `${this.url}/borrowRequests?status=pending&_expand=book`
        )
        .pipe(
          timeout(10000),
          tap((requests) => {
            console.log('Fetched Borrow Requests:', requests); // Debug
          })
        )
    );
  }

  public getIssueRequest(): Observable<ExtendedRequest[]> {
    return (
      this.http
        .get<ExtendedRequest[]>(
          `${this.url}/extendedRequests?reRequest=pending&_expand=book`
        )
        .pipe(
          timeout(10000),
          tap((book) => {
            console.log('Fetched books to reIssue:', book);
          })
        )
    )
  }

  // getReIssueRequest(): Observable<ExtendedRequest[]> {
  //   return this.http
  //     .get<ExtendedRequest[]>(
  //       `${this.url}/extendedRequests?reRequest=pending&_expand=book`
  //     )
  //     .pipe(
  //       timeout(10000),
  //       tap((requests) => {
  //         console.log('Fetched ReIssue Requests:', requests); // Debug
  //       }),
  //       catchError((err) => {
  //         console.error('Error fetching extended reIssue Requests:', err);
  //         return throwError(() => err);
  //       })
  //     );
  // }

  public getReIssueRequest(): Observable<BorrowRequest[]> {
    return this.http
      .get<ExtendedRequest[]>(`${this.url}/extendedRequests?reRequest=pending`)
      .pipe(
        switchMap((extendedRequests) => {
          // For each extended request, fetch its corresponding borrow request
          const requests = extendedRequests.map(extRequest =>
            this.http.get<BorrowRequest>(
              `${this.url}/borrowRequests?bookId=${extRequest.bookId}?_expand=book&_expand=user`
            ).pipe(
              map(borrowRequest => ({
                ...borrowRequest,
                extendedRequest: extRequest // Attach the extended request
              })),
              catchError(() => EMPTY) // kip if borrow request not found
            ));
          return forkJoin(requests).pipe(
            map(results => results.filter(Boolean)) // Remove null results
          );
        }),
        timeout(10000),
        tap((requests) => {
          console.log('Fetched ReIssue Requests with Borrow details:', requests);
        }),
        catchError((err) => {
          console.error('Error fetching extended reIssue Requests:', err);
          return throwError(() => err);
        })
      );
  }

  getBorrowRequestsByUser(userId: string): Observable<BorrowRequest[]> {
    return this.http.get<BorrowRequest[]>(
      `${this.url}?userId=${userId}&_expand=book&_expand=user`
    );
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
    this.snackBar.open('Borrow request denied.', 'Close', this.snackBarConfig);
  }

  private bookStatusUpdated = new Subject<{
    bookId: number;
    status: 'available' | 'borrowed';
  }>();
  bookStatusUpdated$ = this.bookStatusUpdated.asObservable();

  updateBookStatus(bookId: number, status: 'available' | 'borrowed') {
    this.bookStatusUpdated.next({ bookId, status });
  }

  createUserNotification(
    book: BookData,
    status: 'approved' | 'denied',
    userId: string | null
  ): void {
    const newNotif = {
      // bookTitle,
      bookId: book.id,
      userId,
      status,
      isRead: false,
      hasReRequested: false,
    };

    this.http.post(`${this.url}/userNotifications`, newNotif).subscribe({
      next: () => console.log('User notification created'),
      error: (err) => console.error('Failed to create user notification', err),
    });
  }

  updateRequestStatus(
    requestId: string | undefined,
    newStatus: 'approved' | 'denied' | 'returned',
    message?: string
  ) {
    if (!requestId) {
      throw new Error('Invalid request ID');
    }

    return this.http
      .get<any[]>(`${this.url}/borrowRequests?bookId=${requestId}`)
      .pipe(
        switchMap((borrowRequests) => {
          if (!borrowRequests.length)
            throw new Error('No borrow request found');
          const borrowRequest = borrowRequests[borrowRequests.length - 1];

          const updatedRequest = {
            ...borrowRequest,
            status: newStatus,
            message: message ?? borrowRequest.message,
            reRequest:
              newStatus === BorrowStatus.Returned
                ? 'returned'
                : borrowRequest.reRequest,
          };

          return this.http.patch(
            `${this.url}/borrowRequests/${borrowRequest.id}?status=pending`,
            updatedRequest
          );
        }),
        switchMap((updatedRequest: any) => {
          return this.http
            .get<BorrowRequest[]>(
              `${this.url}/userNotifications?bookId=${requestId}`
            )
            .pipe(
              switchMap((notifications) => {
                if (!notifications.length) return of(updatedRequest); // fallback

                const notificationToUpdate = notifications[0];
                const updatedNotification = {
                  ...notificationToUpdate,
                  status: updatedRequest.status,
                  message: updatedRequest.message,
                  adminComment: updatedRequest.message,
                };

                return this.http.patch(
                  `${this.url}/userNotifications/${notificationToUpdate.id}`,
                  updatedNotification
                );
              }),
              switchMap((patchedNotification) => {
                return this.notificationSync.syncBorrowRequestToNotification(
                  updatedRequest
                );
              })
            );
        })
      );
  }

  updateRequestStatusonReturn(
    requestId: string | undefined,
    newStatus: 'approved' | 'denied' | 'returned',
    message?: string
  ) {
    if (!requestId) {
      throw new Error('Invalid request ID');
    }

    return this.http
      .get<any[]>(`${this.url}/borrowRequests?bookId=${requestId}`)
      .pipe(
        switchMap((borrowRequests) => {
          if (!borrowRequests.length)
            throw new Error('No borrow request found');
          const borrowRequest = borrowRequests[borrowRequests.length - 1];

          const updatedRequest = {
            ...borrowRequest,
            status: newStatus,
            message: message ?? borrowRequest.message,
            // reRequest:
            //   newStatus === BorrowStatus.Returned
            //     ? 'returned'
            //     : borrowRequest.reRequest,
          };

          return this.http.patch(
            `${this.url}/borrowRequests/${borrowRequest.id}?status=pending`,
            updatedRequest
          );
        }),

        switchMap((updatedRequest: any) => {
          // Retrieve the related extendedRequest by bookId or other identifiers
          return this.http
            .get<any[]>(
              `${this.url}/extendedRequests?bookId=${updatedRequest.bookId}`
            )
            .pipe(
              switchMap((extendedRequests) => {
                // Assuming extendedRequests array will contain one or more records for the same bookId
                if (extendedRequests.length > 0) {
                  const lastextendedRequest =
                    extendedRequests[extendedRequests.length - 1]; // Use the first matching extendedRequest (if there are multiple)

                  // Now update the record
                  const extendedRequestPayload = {
                    reRequest:
                      newStatus === BorrowStatus.Returned
                        ? BorrowStatus.Returned
                        : BorrowStatus.Pending,
                    // You can add other fields to update here like newDuration, newDeadline etc.
                  };

                  return this.http.patch(
                    `${this.url}/extendedRequests/${lastextendedRequest.reIssueId}`,
                    extendedRequestPayload
                  );
                } else {
                  // Handle the case where no extendedRequest exists for the given bookId
                  console.error('No extendedRequest found for this bookId.');
                  return of(null); // You can return an observable that signals no update
                }
              })
            );
        }),

        switchMap((updatedRequest: any) => {
          return this.http
            .get<BorrowRequest[]>(
              `${this.url}/userNotifications?bookId=${requestId}`
            )
            .pipe(
              switchMap((notifications) => {
                if (!notifications.length) return of(updatedRequest); // fallback

                const notificationToUpdate = notifications[0];
                const updatedNotification = {
                  ...notificationToUpdate,
                  status: updatedRequest.status,
                  message: updatedRequest.message,
                  adminComment: updatedRequest.message,
                };

                return this.http.patch(
                  `${this.url}/userNotifications/${notificationToUpdate.id}`,
                  updatedNotification
                );
              }),
              switchMap((patchedNotification) => {
                return this.notificationSync.syncBorrowRequestToNotification(
                  updatedRequest
                );
              })
            );
        })
      );
  }

  //HEREHREEHEHREHRHERHEHREHRHEH

  public updateReIssueDetails( requestId: string | undefined, oldDeadline: Date, newDuration: number | undefined, newStatus: BorrowStatus.Approved | BorrowStatus.Denied ) {

    const DeadlineOld = new Date(oldDeadline).getTime();
    // const updatedDuration = DeadlineOld + newDuration * 24 * 3600 * 1000 ;

    // const createdAtTime = new Date(createdAt).getTime();
    // this.currentDate.setTime(
    //   createdAtTime + updatedDuration * 24 * 60 * 60 * 1000
    // );
    this.currentDeadline.setTime(
      DeadlineOld + (newDuration ?? 0) * 24 * 60 * 60 * 1000
    );

    // const prevDeadline = this.currentDeadline;
    // const updatedDeadline = this.currentDate;

    return this.http
      .patch(`${this.url}/extendedRequests/${requestId}`, {
        reRequest: newStatus,
        timeLeft: this.calculateTimeLeft(this.currentDeadline),
        oldDeadline: oldDeadline,
        newDeadline: this.currentDeadline,
      })
      .pipe(
        switchMap((updatedRequest) =>
          this.notificationSync.syncBorrowRequestToNotification(updatedRequest)
        )
      );
  }

  updateReIssueDetails2(requestId: string | undefined, newStatus: BorrowStatus.Approved | BorrowStatus.Denied) {
    return this.http
      .patch(`${this.url}/extendedRequests/${requestId}`, {
        reRequest: newStatus,
      })
      .pipe(
        switchMap((updatedRequest) =>
          this.notificationSync.syncBorrowRequestToNotification(updatedRequest)
        )
      );
  }
}
