import { Component, DestroyRef, EnvironmentInjector, OnInit, inject, runInInjectionContext, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { BorrowDialogComponent } from '../../../shared/borrow-dialog/borrow-dialog.component';
import { CommonService } from '../../../common.service';
import { BorrowNotificationService } from '../../../borrow-notification.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, finalize, timeout } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

export interface BookData {
  id: number;
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  stockQuantity: number;
  status: 'available' | 'in-high-demand' | 'out-of-stock';
  isProcessing?: boolean; // Add this optional property
}

export interface BorrowDialogData {
  book: BookData;
  maxDuration: number;
}
@Component({
  selector: 'app-explore-books',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './explore-books.component.html',
  styleUrls: ['./explore-books.component.css']
})
export class ExploreBooksComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private commonService = inject(CommonService);
  private snackBar = inject(MatSnackBar);
  private borrowService = inject(BorrowNotificationService);
  private injector = inject(EnvironmentInjector);

  books = signal<BookData[]>([]);
  isLoading = signal(true);
  totalBooks = signal(0);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  pageSizeOptions = [5, 10, 15, 20, 50];
  sortField = signal('title');
  sortOrder = signal<'ASC' | 'DESC'>('ASC');
  booksWaitingForApproval = signal(new Set<number>());
  borrowedBooks = signal(new Set<number>());
  deniedBooks = signal(new Set<number>());

  private readonly snackBarConfig: MatSnackBarConfig = {
    duration: 5000,
  };

  sortFieldOptions = [
    { label: 'Title', value: 'title' },
    { label: 'Author', value: 'author' },
    { label: 'Genre', value: 'genre' },
    { label: 'Published Year', value: 'publishedYear' },
  ];

  ngOnInit(): void {
    this.loadInitialBorrowStates();
    this.setupSearchListener();
    this.setupBorrowListeners();
    this.loadBooks();
  }

  private loadInitialBorrowStates(): void {
    this.borrowService.getBorrowRequests().pipe(
      timeout(10000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (requests) => {
        const waiting = new Set<number>();
        const borrowed = new Set<number>();
        const denied = new Set<number>();

        requests.forEach((req) => {
          if (req.status === 'pending') {
            waiting.add(req.bookId);
          } else if (req.status === 'approved') {
            borrowed.add(req.bookId);
          } else if (req.status === 'denied') {
            denied.add(req.bookId);
          }
        });

        this.booksWaitingForApproval.set(waiting);
        this.borrowedBooks.set(borrowed);
        this.deniedBooks.set(denied);
      },
      error: (err: unknown) => {
        console.error('Error loading initial borrow s:', err);
        this.snackBar.open('Failed to load borrow states.', 'Close', this.snackBarConfig);
      }
    });
  }

  private setupSearchListener(): void {
    runInInjectionContext(this.injector, () => {
      toObservable(this.searchTerm)
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((term) => {
          console.log('Search Term:', term); // Debug
          this.currentPage.set(1);
          this.loadBooks();
        });
    });
  }

  private setupBorrowListeners(): void {
    this.borrowService.borrowApproved$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bookId: number) => {
        const updatedWaiting = new Set(this.booksWaitingForApproval());
        updatedWaiting.delete(bookId);
        this.booksWaitingForApproval.set(updatedWaiting);

        const borrowed = new Set(this.borrowedBooks());
        borrowed.add(bookId);
        this.borrowedBooks.set(borrowed);

        this.snackBar.open('Book request approved!', 'Close', this.snackBarConfig);
      });

    this.borrowService.borrowDenied$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bookId: number) => {
        const updatedWaiting = new Set(this.booksWaitingForApproval());
        updatedWaiting.delete(bookId);
        this.booksWaitingForApproval.set(updatedWaiting);

        const denied = new Set(this.deniedBooks());
        denied.add(bookId);
        this.deniedBooks.set(denied);

        this.snackBar.open('Book request denied.', 'Close', this.snackBarConfig);
      });
  }

  loadBooks(): void {
    this.isLoading.set(true);
    this.commonService
      .getBooks(
        this.searchTerm(),
        this.currentPage(),
        this.pageSize(),
        this.sortField(),
        this.sortOrder()
      )
      .pipe(
        timeout(10000),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: HttpResponse<BookData[]>) => {
          console.log('Books Response:', response); // Debug
          this.books.set(response.body || []);
          const totalCount = response.headers.get('X-Total-Count');
          this.totalBooks.set(totalCount ? +totalCount : 0);
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          console.error('Error loading books:', err);
          this.snackBar.open(
            'Failed to load books. Please try again later.',
            'Close',
            this.snackBarConfig
          );
          this.books.set([]);
          this.totalBooks.set(0);
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }

  get totalPages(): number {
    return this.totalBooks() > 0 ? Math.ceil(this.totalBooks() / this.pageSize()) : 1;
  }

  getPageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onPageSizeChange(event: MatSelectChange): void {
    this.pageSize.set(event.value as number);
    this.currentPage.set(1);
    this.loadBooks();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadBooks();
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadBooks();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update((p) => p + 1);
      this.loadBooks();
    }
  }

  onSortChange(event: MatSelectChange): void {
    this.sortField.set(event.value as string);
    this.loadBooks();
  }

  toggleSortOrder(): void {
    this.sortOrder.update((order) => (order === 'ASC' ? 'DESC' : 'ASC'));
    this.loadBooks();
  }

// openBorrowDialog(book: BookData): void {
//   if (book.stockQuantity <= 0) {
//     this.snackBar.open('This book is currently out of stock', 'Close', this.snackBarConfig);
//     return;
//   }

//   // Create a new book object with isProcessing set to true
//   const processingBook = { ...book, isProcessing: true };

//   // Update the books array
//   this.books.update(books =>
//     books.map(b => b.id === book.id ? processingBook : b)
//   );

//   const dialogRef = this.dialog.open(BorrowDialogComponent, {
//     width: '400px',
//     data: {
//       book: processingBook,
//       maxDuration: book.status === 'in-high-demand' ? 7 : 14
//     }
//   });

//   dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef))
//     .subscribe((result) => {
//       // Reset processing state
//       this.books.update(books =>
//         books.map(b => b.id === book.id ? { ...b, isProcessing: false } : b)
//       );

//       if (result?.duration) {
//         this.processBorrowRequest(book, result.duration);
//       }
//     });
// }

openBorrowDialog(book: BookData): void {
  if (book.stockQuantity <= 0) {
    this.snackBar.open('This book is currently out of stock', 'Close', this.snackBarConfig);
    return;
  }

  this.books.update((books) =>
    books.map((b) => (b.id === book.id ? { ...b, isProcessing: true } : b))
  );

  const dialogRef = this.dialog.open(BorrowDialogComponent, {
    width: '400px',
    data: {
      book,
      maxDuration: book.status === 'in-high-demand' ? 7 : 14
    }
  });

  dialogRef
    .afterClosed()
    .pipe(
      finalize(() => {
        this.books.update((books) =>
          books.map((b) => (b.id === book.id ? { ...b, isProcessing: false } : b))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe((result) => {
      if (result?.duration) {
        this.processBorrowRequest(book, result.duration);
      }
    });
}

// private processBorrowRequest(book: BookData, duration: number): void {
//   const updatedWaiting = new Set(this.booksWaitingForApproval());
//   updatedWaiting.add(book.id);
//   this.booksWaitingForApproval.set(updatedWaiting);

//   this.borrowService.requestBorrow(book, duration)
//     .pipe(takeUntilDestroyed(this.destroyRef))
//     .subscribe({
//       next: () => {
//         this.snackBar.open(
//           `Request submitted for "${book.title}". Admin will review.`,
//           'Close',
//           this.snackBarConfig
//         );
//       },
//       error: (err) => {
//         console.error('Error requesting borrow:', err);
//         updatedWaiting.delete(book.id);
//         this.booksWaitingForApproval.set(updatedWaiting);
//         this.snackBar.open(
//           'Failed to submit borrow request.',
//           'Close',
//           this.snackBarConfig
//         );
//       }
//     });
// }

private processBorrowRequest(book: BookData, duration: number): void {
  this.borrowService
    .requestBorrow(book, duration)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        const updatedWaiting = new Set(this.booksWaitingForApproval());
        updatedWaiting.add(book.id);
        this.booksWaitingForApproval.set(updatedWaiting);
        this.snackBar.open(
          `Request submitted for "${book.title}". Admin will review.`,
          'Close',
          this.snackBarConfig
        );
      },
      error: (err) => {
        console.error('Error requesting borrow:', err);
        this.snackBar.open(
          'Failed to submit borrow request.',
          'Close',
          this.snackBarConfig
        );
      }
    });
}

public getButtonState(bookId: number): {
  text: string;
  class: string;
  disabled: boolean;
  showSpinner: boolean
} {
  const book = this.books().find(b => b.id === bookId);
  if (!book) {
    return { text: 'Error', class: 'error-btn', disabled: true, showSpinner: false };
  }

  // Check processing state first
  if (book.isProcessing) {
    return {
      text: 'Processing...',
      class: 'processing-btn',
      disabled: true,
      showSpinner: true
    };
  }

  // Then check stock
  if (book.stockQuantity <= 0) {
    return {
      text: 'Out of Stock',
      class: 'out-of-stock-btn',
      disabled: true,
      showSpinner: false
    };
  }

  // Rest of your existing status checks...
  const status = this.getBookStatus(bookId);
  switch (status) {
    case 'pending':
      return { text: 'Request Pending', class: 'pending-btn', disabled: true, showSpinner: false };
    case 'borrowed':
      return { text: 'Already Borrowed', class: 'borrowed-btn', disabled: true, showSpinner: false };
    case 'denied':
      return { text: 'Try Again', class: 'denied-btn', disabled: false, showSpinner: false };
    default:
      return {
        text: book.status === 'in-high-demand' ? 'Borrow (High Demand)' : 'Borrow',
        class: book.status === 'in-high-demand' ? 'high-demand-btn' : 'borrow-btn',
        disabled: false,
        showSpinner: false
      };
  }
}
  private getBookStatus(bookId: number): string {
    if (this.booksWaitingForApproval().has(bookId)) return 'pending';
    if (this.borrowedBooks().has(bookId)) return 'borrowed';
    if (this.deniedBooks().has(bookId)) return 'denied';
    return 'available';
  }
}
