import { Component, OnInit, inject, DestroyRef, signal, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { User } from '../../../auth/user.model';
import { Book } from '../../admin/book/book.component';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { ChartData, ChartType } from 'chart.js';
import { AuthService } from '../../../auth/auth.service';
import { CommonService } from '../../../common.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BorrowRequestService } from '../../../borrow-request.service';
import { BookService } from '../../admin/book/book.service';

@Component({
  selector: 'app-admin-homepage',
  imports: [CommonModule, FormsModule, HighchartsChartModule],
  templateUrl: './admin-homepage.component.html',
  styleUrl: './admin-homepage.component.css',
  standalone: true
})
export class AdminHomepageComponent implements OnInit {
  private authService = inject(AuthService);
  private borrowRequestService = inject(BorrowRequestService);
  private bookService = inject(BookService);
  private destroyRef = inject(DestroyRef);
  users: User[] = [];

  recentBooks = signal<Book[]>([]);

  currentUser: User | null = null;
  borrowRequests = signal<BorrowRequest[]>([]);
  books = signal<Book[]>([]);

  totalUsers = signal<number>(0); // Dummy value for total users
  totalBooks = signal<number>(0); // Dummy value for total books
  pendingRequests = signal<number>(0); // Dummy value for pending requests

  // Example highchart options (Admin charts)
  Highcharts: typeof Highcharts = Highcharts;

  activityChartOptions: Highcharts.Options = {
    chart: { type: 'line' },
    title: { text: 'Admin Activity: Monthly User Engagement' },
    xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    yAxis: {
      min: 0,
      title: { text: 'Engagement Level' }
    },
    series: [{
      type: 'line',
      name: 'Active Users',
      data: [30, 40, 35, 50, 60, 70]
    }]
  };

  genreChartOptions: Highcharts.Options = {
    chart: { type: 'pie' },
    title: { text: 'Top Book Genres' },
    series: [{
      type: 'pie',
      name: 'Books',
      data: [
        { name: 'Fiction', y: 40 },
        { name: 'Science', y: 30 },
        { name: 'Mystery', y: 20 },
        { name: 'History', y: 10 }
      ]
    }]
  };

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadRecentBooks();
    this.loadStats();
  }

  constructor(private commonService: CommonService) {}

  loadRecentBooks(): void {
    this.commonService.getBookDetails(1, 5, '-id', 'DESC')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const books = response.body;
          if (!books || !Array.isArray(books)) {
            this.error = 'No books found';
            return;
          }
          this.recentBooks.set(books);
        },
        error: () => this.error = 'Failed to load recent books'
      });
  }

  loadStats(): void {
    // Here we would fetch stats like totalUsers, totalBooks, etc.
    this.totalUsers.set(150); // Dummy data for now
    this.totalBooks.set(500); // Dummy data for now
    this.pendingRequests.set(25); // Dummy data for now
  }

  error: string | null = null;
}
