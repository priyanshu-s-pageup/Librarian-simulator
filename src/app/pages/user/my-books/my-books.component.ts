import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/auth.service';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { BorrowRequestService } from '../../../borrow-request.service';
import { BookService } from '../../admin/book/book.service';
import { MatIcon } from '@angular/material/icon';
import { BorrowDialogComponent } from '../../../shared/borrow-dialog/borrow-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { BookData } from '../explore-books/explore-books.component';
import { finalize } from 'rxjs';
import { BorrowNotificationService } from '../../../borrow-notification.service';
import { Book } from '../../admin/book/book.component';

@Component({
  selector: 'app-my-books',
  imports: [CommonModule, MatCardModule, MatIcon, ],
  standalone: true,
  templateUrl: './my-books.component.html',
  styleUrls: ['./my-books.component.css']
})
export class MyBooksComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private borrowRequestService = inject(BorrowRequestService);
  private bookService = inject(BookService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private borrowService = inject(BorrowNotificationService);

  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  borrowRequests = signal<BorrowRequest[]>([]);
  public books = signal<Book[]>([]);

  myApprovedBooks = computed(() => {
    const approvedRequests = this.borrowRequests().filter(br => br.status === 'approved');
    return approvedRequests
      .map(br => this.books().find(book => book.id === String(br.bookId)))
      .filter((book): book is Book => !!book);
  });

  myDeadlineAlerts = computed(() => {
    // const a = 10;
    const deadlinesAlert = this.borrowRequests().filter(br => br.duration <= 7 && br.status === 'approved');
    return deadlinesAlert
      .map(br => this.books().find(book => book.id === String(br.bookId)))
      .filter((book): book is Book => !!book);
  })

  myExpiredBooks = computed(() => {
    // const b = 20;
    const expiredBooks = this.borrowRequests().filter(br => br.duration <= 0 && br.status === 'approved');
    return expiredBooks
      .map(br => this.books().find(book => book.id === String(br.bookId)))
      .filter((book): book is Book => !!book);
  })

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id;

    if (!userId) {
      this.snackBar.open('User is not logged in', 'Close', { duration: 3000 });
      return;
    }

    this.borrowRequestService.getBorrowRequestsByUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => this.borrowRequests.set(requests),
        error: () => this.snackBar.open('Failed to load borrow requests', 'Close', { duration: 3000 })
      });

    this.bookService.getAllBooks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books) => this.books.set(books),
        error: () => this.snackBar.open('Failed to load books', 'Close', { duration: 3000 })
      });
  }
  openRequestDialog(book: Book) {
    const userId = this.currentUserId;
    const dialogRef = this.dialog.open(BorrowDialogComponent, {
      width: '500px',
      data: {
        book,
        userId,
        maxDuration: book.status === 'in-high-demand' ? 7 : 14
      }
    });

    dialogRef.afterClosed()
      .pipe(
        finalize(() => {
          this.books.update(books =>
            books.map(b => b.id === String(book.id) ? {...b, isProcessing: false} : b)
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        if (result?.newDuration) {
          this.processReRequest(book, userId, result.newDuration);
        }
      });
  }

  private processReRequest(book: Book, userId: string | null, newDuration: number): void {
    this.borrowService.applyreRequest(book, userId, newDuration)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.books.update(books =>
            books.map(b =>
              b.id === book.id ? {...b, stockQuantity: b.stockQuantity} : b
            )
          );

          this.snackBar.open(
            `Request submitted for "${book.title}". Admin will review.`,
            'Close',
            this.snackBarConfig
          );
        },
        error: (err) => {
          console.error('Borrow request failed:', err);
          this.snackBar.open(
            err.status === 400
              ? 'Cannot borrow: ' + err.error.message
              : 'Failed to submit request',
            'Close',
            this.snackBarConfig
          );
        }
      });
  }
}
