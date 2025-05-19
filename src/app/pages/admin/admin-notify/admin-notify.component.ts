import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { BorrowNotificationService } from '../../../borrow-notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, switchMap, timeout } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { CommonService } from '../../../common.service';

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

@Component({
  selector: 'app-admin-notify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-notify.component.html',
  styleUrls: ['./admin-notify.component.css']
})
export class AdminNotifyComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private borrowService = inject(BorrowNotificationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private commonService = inject(CommonService);

  borrowRequests = signal<BorrowRequest[]>([]);
  isLoading = signal(true);
  processingRequests = signal<Set<number>>(new Set());

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  ngOnInit() {
    this.setupListeners();
    this.loadBorrowRequests();
  }

  private setupListeners(): void {
    this.borrowService.borrowRequests$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          this.borrowRequests.set(this.sortRequestsNewestFirst(requests));
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading requests:', err);
          this.borrowRequests.set([]);
          this.isLoading.set(false);
          this.snackBar.open('Failed to load requests.', 'Close', this.snackBarConfig);
        }
      });
  }

  private sortRequestsNewestFirst(requests: BorrowRequest[]): BorrowRequest[] {
    return requests.sort((a, b) => b.id - a.id);
  }

  loadBorrowRequests(): void {
    this.isLoading.set(true);
    this.borrowService.getBorrowRequests()
      .pipe(
        timeout(5000),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (requests) => {
          this.borrowRequests.set(this.sortRequestsNewestFirst(requests));
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading requests:', err);
          this.isLoading.set(false);
          this.snackBar.open('Failed to load requests', 'Close', this.snackBarConfig);
        }
      });
  }

  openConfirmDialog(action: 'lend' | 'deny', bookId: number, bookTitle: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        action,
        bookTitle,
        message: action === 'lend' ?
          'Are you sure you want to lend this book?' :
          'Are you sure you want to deny this request?'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          if (action === 'lend') {
            this.onLend(bookId);
          } else {
            this.onDeny(bookId);
          }
        }
      });
  }

  // onLend(bookId: number): void {
  //   const request = this.borrowRequests().find(req => req.bookId === bookId);
  //   if (!request) {
  //     this.snackBar.open('Request not found!', 'Close', this.snackBarConfig);
  //     return;
  //   }

  //   if (request.book.stockQuantity <= 0) {
  //     this.snackBar.open('Cannot lend - book is out of stock', 'Close', this.snackBarConfig);
  //     return;
  //   }

  //   this.processingRequests.update(reqs => {
  //     reqs.add(bookId);
  //     return reqs;
  //   });

  //   this.borrowService.approveBorrow(request.id).pipe(
  //     switchMap(() => this.commonService.updateBookStock(bookId.toString(), -1)),
  //     finalize(() => {
  //       this.processingRequests.update(reqs => {
  //         reqs.delete(bookId);
  //         return reqs;
  //       });
  //     }),
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe({
  //     next: (updatedBook) => {
  //       this.borrowRequests.update(requests =>
  //         requests.map(req =>
  //           req.id === request.id ?
  //             {
  //               ...req,
  //               status: 'approved',
  //               book: { ...req.book, stockQuantity: updatedBook.stockQuantity }
  //             } : req
  //         )
  //       );
  //       this.snackBar.open(
  //         `Book lent successfully! ${updatedBook.stockQuantity} remaining`,
  //         'Close',
  //         this.snackBarConfig
  //       );
  //     },
  //     error: (err) => {
  //       console.error('Error processing lend:', err);
  //       const message = err.status === 400 ?
  //         'Cannot lend - book out of stock' :
  //         'Failed to process lend';
  //       this.snackBar.open(message, 'Close', this.snackBarConfig);
  //     }
  //   });
  // }

  // onDeny(bookId: number): void {
  //   const request = this.borrowRequests().find(req => req.bookId === bookId);
  //   if (!request) return;

  //   this.processingRequests.update(reqs => {
  //     reqs.add(bookId);
  //     return reqs;
  //   });

  //   this.borrowService.denyBorrow(request.id).pipe(
  //     finalize(() => {
  //       this.processingRequests.update(reqs => {
  //         reqs.delete(bookId);
  //         return reqs;
  //       });
  //     }),
  //     takeUntilDestroyed(this.destroyRef)
  //   ).subscribe({
  //     next: () => {
  //       this.borrowRequests.update(requests =>
  //         requests.map(req =>
  //           req.id === request.id ? { ...req, status: 'denied' } : req
  //         )
  //       );
  //       this.snackBar.open('Request denied', 'Close', this.snackBarConfig);
  //     },
  //     error: (err) => {
  //       console.error('Error denying request:', err);
  //       this.snackBar.open('Failed to deny request', 'Close', this.snackBarConfig);
  //     }
  //   });
  // }

  // Update the onLend method
onLend(bookId: number): void {
  const request = this.borrowRequests().find((req) => req.bookId === bookId);
  if (!request) {
    this.snackBar.open('Request not found!', 'Close', this.snackBarConfig);
    return;
  }

  if (request.book.stockQuantity <= 0) {
    this.snackBar.open('Cannot lend - book is out of stock', 'Close', this.snackBarConfig);
    return;
  }

  this.processingRequests.update((reqs) => new Set(reqs).add(request.id));

  this.borrowService
    .approveBorrow(request.id)
    .pipe(
      switchMap(() =>
        this.commonService.updateBookStock(bookId.toString(), -1).pipe(
          catchError((err) => {
            console.error('Stock update failed:', err);
            throw err;
          })
        )
      ),
      finalize(() => {
        this.processingRequests.update((reqs) => {
          const newReqs = new Set(reqs);
          newReqs.delete(request.id);
          return newReqs;
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (updatedBook) => {
        this.borrowRequests.update((requests) =>
          requests.filter((req) => req.id !== request.id)
        );
        this.snackBar.open(
          `Book lent successfully! ${updatedBook.stockQuantity} remaining`,
          'Close',
          this.snackBarConfig
        );
      },
      error: (err) => {
        console.error('Lend operation failed:', err);
        this.snackBar.open(
          err.status === 400 ? 'Cannot lend - book out of stock' : 'Lend failed',
          'Close',
          this.snackBarConfig
        );
      }
    });
}

onDeny(bookId: number): void {
  const request = this.borrowRequests().find((req) => req.bookId === bookId);
  if (!request) {
    this.snackBar.open('Request not found!', 'Close', this.snackBarConfig);
    return;
  }

  this.processingRequests.update((reqs) => new Set(reqs).add(request.id));

  this.borrowService
    .denyBorrow(request.id)
    .pipe(
      finalize(() => {
        this.processingRequests.update((reqs) => {
          const newReqs = new Set(reqs);
          newReqs.delete(request.id);
          return newReqs;
        });
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: () => {
        this.borrowRequests.update((requests) =>
          requests.filter((req) => req.id !== request.id)
        );
        this.snackBar.open('Request denied', 'Close', this.snackBarConfig);
      },
      error: (err) => {
        console.error('Error denying request:', err);
        this.snackBar.open('Failed to deny request', 'Close', this.snackBarConfig);
      }
    });
}
  getButtonState(request: BorrowRequest): {
    lend: { text: string; class: string; disabled: boolean; visible: boolean };
    deny: { text: string; class: string; disabled: boolean; visible: boolean };
  } {
    const canLend = request.book.stockQuantity > 0;

    switch (request.status) {
      case 'approved':
        return {
          lend: {
            text: 'Borrowed',
            class: 'borrowed-btn',
            disabled: true,
            visible: true
          },
          deny: {
            text: 'Deny',
            class: 'deny-btn',
            disabled: true,
            visible: false
          }
        };
      case 'denied':
        return {
          lend: {
            text: 'Lend',
            class: 'lend-btn',
            disabled: true,
            visible: false
          },
          deny: {
            text: 'Denied',
            class: 'denied-btn',
            disabled: true,
            visible: true
          }
        };
      default: // pending
        return {
          lend: {
            text: canLend ? 'Lend' : 'Out of Stock',
            class: canLend ? 'lend-btn' : 'out-of-stock-btn',
            disabled: !canLend,
            visible: true
          },
          deny: {
            text: 'Deny',
            class: 'deny-btn',
            disabled: false,
            visible: true
          }
        };
    }
  }
}
