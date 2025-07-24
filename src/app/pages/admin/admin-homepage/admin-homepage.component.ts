import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { User } from '../../../auth/user.model';
import { Book } from '../../admin/book/book.component';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { ChartData, ChartType } from 'chart.js';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BorrowRequestService } from '../../../borrow-request.service';
import { BookService } from '../../admin/book/book.service';
import { UserDialogComponent } from '../../../shared/user-dialog/user-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

export interface DemandedBook extends Book {
  requestCount: number;
}

@Component({
  selector: 'app-admin-homepage',
  imports: [CommonModule, FormsModule, HighchartsChartModule],
  templateUrl: './admin-homepage.component.html',
  styleUrl: './admin-homepage.component.css',
  standalone: true,
})
export class AdminHomepageComponent implements OnInit {
  private authService = inject(AuthService);
  private borrowRequestService = inject(BorrowRequestService);
  private bookService = inject(BookService);
  private destroyRef = inject(DestroyRef);
  users: User[] = [];

  mostDemandedBooks = signal<DemandedBook[]>([]);
  public activeUsers = signal<User[]>([]);

  public currentUser: User | null = null;
  public borrowRequests = signal<BorrowRequest[]>([]);
  public books = signal<Book[]>([]);

  private router = inject(Router);

  public totalUsers = signal<number>(0);
  public totalBooks = signal<number>(0);
  public pendingRequests = signal<number>(0);

  constructor(
    private readonly dialog: MatDialog
  ) // private readonly snackBar: MatSnackBar
  {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadMostDemandedBooks();
    this.loadStats();
    this.calculateGenreDemand();
    this.loadUserActivityChart();
    this.loadActiveUsers();
  }

  public Highcharts: typeof Highcharts = Highcharts;

  public activityChartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    title: { text: 'Monthly User Engagement' },
    xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    yAxis: {
      min: 0,
      title: { text: 'Engagement Level' },
    },
    series: [
      {
        type: 'line',
        name: 'Active Users',
        data: [30, 40, 35, 50, 60, 70],
      },
    ],
  };

  public genreChartOptions: Highcharts.Options = {
    chart: { type: 'pie' },
    title: { text: 'Top Book Genres by Demand' },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
    },
    series: [
      {
        type: 'pie',
        name: 'Requests',
        data: [],
      },
    ],
  };

  public loadMostDemandedBooks(): void {
    forkJoin({
      requests: this.borrowRequestService.getAllBorrowRequests(),
      books: this.bookService.getAllBooks(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ requests, books }) => {
          if (!requests || requests.length === 0) {
            this.mostDemandedBooks.set([]);
            return;
          }

          const bookRequestCounts = requests.reduce((acc, request) => {
            const bookId = String(request.bookId);
            if (bookId) {
              acc[bookId] = (acc[bookId] || 0) + 1;
            }
            return acc;
          }, {} as { [key: string]: number });

          const demandedBooks: DemandedBook[] = books
            .map((book) => ({
              ...book,
              requestCount: book.id ? bookRequestCounts[book.id] || 0 : 0,
            }))
            .filter((book) => book.requestCount > 0) // Only show books that have been requested
            .sort((a, b) => b.requestCount - a.requestCount)
            .slice(0, 5); // Get top 5 most demanded books

          this.mostDemandedBooks.set(demandedBooks);
        },
        error: (err) => {
          console.error('Failed to load most demanded books', err);
          this.error = 'Failed to load most demanded books';
        },
      });
  }

  public loadActiveUsers(): void {
    this.authService
      .getAllUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.activeUsers.set(
            users.filter((u) => u.id !== this.currentUser?.id)
          );
        },
        error: (err) => {
          console.error('Failed to load users', err);
          this.error = 'Failed to load active users';
        },
      });
  }

  public loadStats(): void {
    forkJoin({
      users: this.authService.getAllUsers(),
      books: this.bookService.getAllBooks(),
      requests: this.borrowRequestService.getAllBorrowRequests(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ users, books, requests }) => {
          this.totalUsers.set(users.length);
          this.totalBooks.set(books.length);
          const pending = requests.filter((req) => req.status === 'pending').length;
          this.pendingRequests.set(pending);
        },
        error: (err) => {
          console.error('Failed to load dashboard stats', err);
          this.error = 'Failed to load dashboard stats';
        },
      });
  }

  public calculateGenreDemand(): void {
    this.borrowRequestService
      .getAllBorrowRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          if (!requests || requests.length === 0) {
            this.genreChartOptions = {
              ...this.genreChartOptions,
              series: [
                {
                  type: 'pie',
                  name: 'Requests',
                  data: [],
                },
              ],
              title: { text: 'No borrow request data available' },
            };
            return;
          }

          const genreCounts = requests.reduce((acc, request) => {
            const genre = request.book?.genre;
            if (genre) {
              acc[genre] = (acc[genre] || 0) + 1;
            }
            return acc;
          }, {} as { [key: string]: number });

          const chartData = Object.keys(genreCounts).map((genre) => ({
            name: genre,
            y: genreCounts[genre],
          }));

          this.genreChartOptions = {
            ...this.genreChartOptions,
            series: [
              {
                type: 'pie',
                name: 'Requests',
                data: chartData,
              },
            ],
          };
        },
        error: (err) => {
          console.error('Failed to load genre demand data', err);
          this.error = 'Failed to load genre demand data';
          this.genreChartOptions = {
            ...this.genreChartOptions,
            series: [],
            title: { text: 'Failed to load genre demand data' },
          };
        },
      });
  }

  loadUserActivityChart(): void {
    this.borrowRequestService
      .getAllBorrowRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          // Aggregate by day (last 7 days)
          const now = new Date();
          const days: string[] = [];
          const dayCounts: number[] = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate() - i
            );
            days.push(
              d.toLocaleDateString('default', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
            );
            dayCounts.push(0);
          }
          // Count requests per day
          requests.forEach((req) => {
            let createdAt: Date;
            if (typeof req.createdAt === 'number') {
              createdAt = new Date(req.createdAt);
            } else {
              createdAt = new Date(req.createdAt);
            }
            for (let i = 0; i < 7; i++) {
              const d = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - (6 - i)
              );
              const nextDay = new Date(
                d.getFullYear(),
                d.getMonth(),
                d.getDate() + 1
              );
              if (createdAt >= d && createdAt < nextDay) {
                dayCounts[i]++;
                break;
              }
            }
          });
          this.activityChartOptions = {
            ...this.activityChartOptions,
            xAxis: { categories: days },
            title: {
              text: 'User Activity: Daily User Engagement (Last 7 Days)',
            },
            series: [
              {
                type: 'line',
                name: 'Active Users',
                data: dayCounts,
              },
            ],
          };
        },
        error: (err) => {
          console.error('Failed to load user activity data', err);
          this.activityChartOptions = {
            ...this.activityChartOptions,
            title: { text: 'Failed to load user activity data' },
            series: [{ type: 'line', name: 'Active Users', data: [] }],
          };
        },
      });
  }

  public openUserDialog(user: any): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '1000px',
      data: user,
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  public openUserList(): void {
    this.router.navigate(['/user-list']);
  }

  public openBookList(): void {
    this.router.navigate(['/book-list']);
  }

  public openBorrowRequests(): void {
    this.router.navigate(['/app-admin-notify']);
  }

  error: string | null = null;
}
