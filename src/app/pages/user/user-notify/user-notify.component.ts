import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserNotificationService } from './user.notification.service';
import { ReRequestDialogComponent } from './re-request.dialog-component';
import { MatIcon } from '@angular/material/icon';
import { NotificationSyncService } from './notification-sync.service';
import { AuthService } from '../../../auth/auth.service';
import { BorrowRequestService } from '../../../borrow-request.service';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { BookService } from '../../admin/book/book.service';
import { Book } from '../../admin/book/book.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { ViewNotificationDialogComponent } from '../../../shared/view-notification-dialog/view-notification-dialog.component';
import { DialogRef } from '@angular/cdk/dialog';

export interface BookReference {
  id: string;
  title: string;
  author: string;
  genre: string;
}

interface BorrowRequestNotification {
  id: number;
  bookId: string;
  status: 'approved' | 'denied' | 'pending' | 'returned';
  reRequest?: 'approved' | 'denied' | 'pending' | 'returned';
  hasReRequested: boolean;
  // isRead: boolean;
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

@Component({
  selector: 'app-user-notify',
  standalone: true,
  templateUrl: './user-notify.component.html',
  styleUrls: ['./user-notify.component.css'],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIcon,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
  ],
})
export class UserNotifyComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  // private dialog = inject(MatDialog);
  private notificationService = inject(UserNotificationService);
  private destroyRef = inject(DestroyRef);
  private borrowRequestService = inject(BorrowRequestService);
  private bookService = inject(BookService);

  notifications = signal<BorrowRequestNotification[]>([]);
  borrowRequests = signal<BorrowRequest[]>([]);

  books = signal<Book[]>([]);
  sortDirection = signal<'desc' | 'asc'>('desc');
  currentFilter = signal<'all' | 'approved' | 'denied' | 'pending' | 'returned'>('all');
  currentPage = signal(1);
  itemsPerPage = signal(5);
  itemsPerPageOptions = [5, 10, 15, 20, 50];
  private readonly snackBarConfig: MatSnackBarConfig = { duration: 3000 };

  toggleSortDirection(): void {
    this.sortDirection.update((current) =>
      current === 'desc' ? 'asc' : 'desc'
    );
  }

  filteredNotifications = computed(() => {
    const filter = this.currentFilter();
    const all = this.borrowRequestNotifications();
    return filter === 'all'
      ? all
      : all.filter((n) => n.status === filter || n.reRequest === filter);
  });

  constructor(
    private notificationSync: NotificationSyncService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id;

    if (!userId) {
      this.snackBar.open('User is not logged in', 'Close', this.snackBarConfig);
      return;
    }

    this.borrowRequestService
      .getBorrowRequestsByUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => this.borrowRequests.set(requests),
        error: () =>
          this.snackBar.open(
            'Failed to load borrow requests',
            'Close',
            this.snackBarConfig
          ),
      });

    this.bookService
      .getAllBooks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books) => this.books.set(books),
        error: () =>
          this.snackBar.open(
            'Failed to load books',
            'Close',
            this.snackBarConfig
          ),
      });

    this.notificationService
      .getUserNotifications(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => this.notifications.set(notifications),
        error: () =>
          this.snackBar.open(
            'Failed to load notifications',
            'Close',
            this.snackBarConfig
          ),
      });
    this.loadNotifications();

    // Subscribe to notification updates
    this.notificationSync.notificationsUpdated$.subscribe(() => {
      this.loadNotifications();
    });
  }

  setFilter(
    filter: 'all' | 'approved' | 'denied' | 'pending' | 'returned'
  ): void {
    this.currentFilter.set(filter);
  }

  markAsRead(notificationId: number): void {
    this.notificationService.markAsRead(notificationId).subscribe(() => {
      this.borrowRequests.update((n) =>
        n.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    });
  }

  openNotificationDialog(notification: BorrowRequestNotification): void {
    const dialogRef = this.dialog.open(ViewNotificationDialogComponent, {
      width: '400px',
      data: notification,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed', result);
    });
  }

  private loadNotifications() {
    const userId = this.authService.getCurrentUser()?.id;
    this.notificationService
      .getUserNotifications(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => this.notifications.set(notifications),
        error: () =>
          this.snackBar.open(
            'Failed to load notifications',
            'Close',
            this.snackBarConfig
          ),
      });
  }

  // borrowRequestNotifications = computed<BorrowRequestNotification[]>(() =>
  //   this.borrowRequests().map((br) => {
  //     const book = this.books().find(b => b.id === String(br.bookId));

  //     return {
  //       id: br.id,
  //       bookId: String(br.bookId),
  //       status: br.status,
  //       isRead: br.isRead ?? false,
  //       hasReRequested: br.reRequest === 'approved',
  //       message: br.message,
  //       adminComment: br.adminComment,
  //       book: {
  //         id: book?.id ?? String(br.bookId),
  //         title: book?.title ?? 'Unknown Title',
  //         author: book?.author ?? 'Unknown Author',
  //         genre: book?.genre ?? 'Unknown Genre',
  //       },
  //       date: new Date(br.createdAt),
  //     };
  //     })
  //     .sort((a, b) =>
  //       this.sortDirection() === 'desc'
  //         ? b.date.getTime() - a.date.getTime()
  //         : a.date.getTime() - b.date.getTime()
  //     )
  // );

  borrowRequestNotifications = computed<BorrowRequestNotification[]>(() =>
    this.borrowRequests()
      .map((br) => {
        const book = this.books().find((b) => b.id === String(br.bookId));

        return {
          id: br.id,
          bookId: String(br.bookId),
          status: br.status,
          // isRead: br.isRead ?? false,
          hasReRequested: br.extendedRequest?.reRequest === 'approved',
          message: br.message,
          // adminComment: br.adminComment,
          book: {
            id: book?.id ?? String(br.bookId),
            title: book?.title ?? 'Unknown Title',
            author: book?.author ?? 'Unknown Author',
            genre: book?.genre ?? 'Unknown Genre',
          },
          date: new Date(br.createdAt),
        };
      })
      .sort((a, b) =>
        this.sortDirection() === 'desc'
          ? b.date.getTime() - a.date.getTime()
          : a.date.getTime() - b.date.getTime()
      )
  );

  openReRequestDialog(notification: BorrowRequest): void {
    const dialogRef = this.dialog.open(ReRequestDialogComponent, {
      width: '350px',
      data: {
        bookTitle: notification.book.title,
        previousMessage: notification.message,
      },
    });

    dialogRef.afterClosed().subscribe((message: string | undefined) => {
      if (message) {
        this.notificationService
          .sendReRequest(notification.id, message)
          .subscribe(() => {
            this.borrowRequests.update((n) =>
              n.map((notif) =>
                notif.id === notification.id
                  ? { ...notif, hasReRequested: true }
                  : notif
              )
            );
            this.snackBar.open(
              'Re-request sent to admin',
              'Close',
              this.snackBarConfig
            );
          });
      }
    });
  }

  showPagination = computed(() => {
    return (
      this.filteredNotifications().length > this.itemsPerPage() ||
      this.currentPage() > 1
    );
  });

  paginatedNotifications = computed(() => {
    const startIndex = (this.currentPage() - 1) * this.itemsPerPage();
    const endIndex = startIndex + this.itemsPerPage();
    return this.filteredNotifications().slice(startIndex, endIndex);
  });

  // Add these methods for pagination control
  totalPages = computed(() => {
    return Math.ceil(this.filteredNotifications().length / this.itemsPerPage());
  });

  setPage(page: number): void {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
  }

  // onItemsPerPageChange(newValue: number): void {
  //   this.itemsPerPage.set(newValue);
  //   this.currentPage.set(1);
  // }

  onItemsPerPageChange(newValue: number): void {
    this.itemsPerPage.set(newValue);
    const maxPage = Math.ceil(this.filteredNotifications().length / newValue);
    this.currentPage.set(Math.min(this.currentPage(), maxPage));
  }
}
