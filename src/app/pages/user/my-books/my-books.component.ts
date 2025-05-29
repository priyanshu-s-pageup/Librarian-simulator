import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/auth.service';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { BorrowRequestService } from '../../../borrow-request.service';
import { BookService } from '../../admin/book/book.service';
import { Book } from '../../admin/book/book.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-my-books',
  imports: [CommonModule, MatCardModule, MatIcon],
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

  borrowRequests = signal<BorrowRequest[]>([]);
  books = signal<Book[]>([]);

  myApprovedBooks = computed(() => {
    const approvedRequests = this.borrowRequests().filter(br => br.status === 'approved');
    return approvedRequests
      .map(br => this.books().find(book => book.id === String(br.bookId)))
      .filter((book): book is Book => !!book);
  });

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
}
