import {
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BorrowRequest } from '../../models/borrow-request.model';
import { BorrowNotificationService } from '../../borrow-notification.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { BookService } from '../../pages/admin/book/book.service';
import { BookData } from '../../pages/user/explore-books/explore-books.component';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MessageDialogComponent } from '../message-dialog/message-dialog.component';
import { BorrowStatus } from '../../models/borrow-status.enum';
import { Book } from '../../pages/admin/book/book.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-view-user-requests-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatButtonModule],
  templateUrl: './view-user-requests-dialog.component.html',
  styleUrls: ['./view-user-requests-dialog.component.css'],
})
export class ViewUserRequestsDialogComponent implements OnInit {
  public borrowRequests: BorrowRequest[] = [];
  public reIssueRequests: BorrowRequest[] = [];

  private destroyRef = inject(DestroyRef);
  private snackBar = inject(MatSnackBar);

  private bookService = inject(BookService);
  private borrowService = inject(BorrowNotificationService);

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  public books = signal<BookData[]>([]);
  public bookie = signal<Book[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.loadReIssueRequests();

    this.bookService
      .getAllBooks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books) => this.bookie.set(books),
        error: () =>
          this.snackBar.open('Failed to load books', 'Close', {
            duration: 3000,
          }),
      });
  }

  filterPendingRequests(): BorrowRequest[] {
    return this.borrowRequests.filter(
      (request) => request.status == BorrowStatus.Pending
    );
  }

  filterReIssueRequests(): BorrowRequest[] {
    return this.reIssueRequests.filter(
      (request) => request.reRequest === BorrowStatus.Pending
    );
  }

  private loadRequests(): void {
    this.borrowService.getBorrowRequests().subscribe((allRequests) => {
      this.borrowRequests = allRequests.filter(
        (req) => req.userId === this.data.userId
      );
    });
  }

  private loadReIssueRequests(): void {
    this.borrowService.getReIssueRequest().subscribe((allRequests) => {
      this.reIssueRequests = allRequests.filter(
        (req) => req.userId === this.data.userId
      );
    });
  }

  public onLend(request: BorrowRequest): void {
    console.log('Lending request for bookId:', request.bookId);
    this.borrowService
      .updateRequestStatus(request.bookId, BorrowStatus.Approved)
      .subscribe({
        next: () => {
          console.log('Request status updated to approved');
          this.removeRequestFromUI(request.id);
        },
        error: (err) => {
          console.error('Failed to approve request:', err);
        },
      });
  }

  public onLendB(request: BorrowRequest): void {
    this.borrowService
      .updateReIssueDetails(
        request.id,
        request.createdAt,
        request.duration,
        request.newDuration,
        'approved'
      )
      .subscribe({
        next: () => {
          this.removeRequestFromUI(request.id);
        },
        error: (err) => {
          console.error('Failed to approve request:', err);
        },
      });
  }

  public onDeny(request: BorrowRequest): void {
    const dialogRef = this.dialog.open(MessageDialogComponent, {
      width: '400px',
      data: { message: '' },
    });

    dialogRef.afterClosed().subscribe((message: string | undefined) => {
      if (message !== undefined) {
        request.message = message;

        this.borrowService
          .updateRequestStatus(request.bookId, BorrowStatus.Denied, message)
          .subscribe({
            next: () => {
              const books = this.bookie();
              console.log('Books: ', books);

              const bookToUpdate = books.find(
                (book) => book.id === request.bookId
              );

              if (bookToUpdate) {
                const updatedBook = {
                  ...bookToUpdate,
                  stockQuantity: bookToUpdate.stockQuantity + 1,
                };

                console.log('updating stock: ', updatedBook);

                this.bookService
                  .updateBookStock(updatedBook.id, updatedBook)
                  .subscribe({
                    next: () => {
                      console.log('Stock updated success wala fully..');
                    },
                    error: (err) => {
                      console.error(
                        'Failed to update stock somehow.. Look at this:',
                        err
                      );
                    },
                  });
              }

              this.removeRequestFromUI(request.id);
            },
            error: (err) => {
              console.error('Failed to deny request:', err);
            },
          });
      }
    });
  }

  public onDenyB(request: BorrowRequest): void {
    this.borrowService.updateReIssueDetails2(request.id, 'denied').subscribe({
      next: () => {
        this.removeRequestFromUI(request.id);
      },
      error: (err) => {
        console.error('Failed to deny request:', err);
      },
    });
  }

  @Output() allRequestsHandled = new EventEmitter<void>();

  private removeRequestFromUI(requestId: number): void {
    this.borrowRequests = this.borrowRequests.filter(
      (req) => req.id !== requestId
    );
    this.reIssueRequests = this.reIssueRequests.filter(
      (req) => req.id !== requestId
    );

    if (this.borrowRequests.length === 0) {
      this.allRequestsHandled.emit(); //
    }

    if (this.reIssueRequests.length === 0) {
      this.allRequestsHandled.emit(); //
    }
  }
}
