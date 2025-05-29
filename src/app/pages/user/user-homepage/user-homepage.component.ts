import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
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
  selector: 'app-user-homepage',
  imports: [CommonModule, FormsModule, HighchartsChartModule],
  templateUrl: './user-homepage.component.html',
  styleUrl: './user-homepage.component.css',
  standalone: true
})
export class UserHomepageComponent implements OnInit {
  private authService = inject(AuthService);
  private borrowRequestService = inject(BorrowRequestService);
  private bookService = inject(BookService);
  private destroyRef = inject(DestroyRef);

  recentBooks = signal<Book[]>([]);


  currentUser: User | null = null;

  borrowRequests = signal<BorrowRequest[]>([]);
  books = signal<Book[]>([]);
  approvedBooks = computed(() => {
    const approved = this.borrowRequests().filter(br => br.status === 'approved');
    return approved
      .map(req => this.books().find(book => book.id === String(req.bookId)))
      .filter((book): book is Book => !!book);
  });

  defaultCovers = [
    'https://images.pexels.com/photos/276514/pexels-photo-276514.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/942317/pexels-photo-942317.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/326501/pexels-photo-326501.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/56759/pexels-photo-56759.jpeg?auto=compress&cs=tinysrgb&w=300',
    'https://images.pexels.com/photos/196646/pexels-photo-196646.jpeg?auto=compress&cs=tinysrgb&w=300'
  ];


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

        // const rawBooks = Array.isArray(books) ? books : books.data; // Adjust based on actual shape

        const booksWithCovers = books.map((book: Book) => ({
          ...book,
          coverUrl: this.getRandomCover()
        }));

        this.recentBooks.set(booksWithCovers);
      },
      error: () => this.error = 'Failed to load recent books'
    });
}

  getRandomCover(): string {
    const index = Math.floor(Math.random() * this.defaultCovers.length);
    return this.defaultCovers[index];
  }


  loading = false;
  error: string | null = null;

  Highcharts: typeof Highcharts = Highcharts;

  activityChartOptions: Highcharts.Options = {
    chart: { type: 'column' },
    title: { text: 'Your Weekly Activity' },
    xAxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      title: { text: 'Day' }
    },
    yAxis: {
      min: 0,
      title: { text: 'Number of Activities' }
    },
    series: [{
      name: 'Books Borrowed',
      type: 'column',
      data: [2, 3, 1, 4, 2, 1, 3]
    }]
  };

  activityChartType: ChartType = 'bar';
  activityChartData: ChartData<'bar'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [3, 5, 2, 6, 4, 7, 1],
        label: 'Books Viewed',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        data: [1, 2, 1, 3, 2, 1, 0],
        label: 'Books Borrowed',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  genreChartOptions: Highcharts.Options = {
    chart: { type: 'pie' },
    title: { text: 'Favorite Genres' },
    series: [{
      name: 'Books',
      type: 'pie',
      data: [
        { name: 'Fiction', y: 45 },
        { name: 'Science', y: 25 },
        { name: 'Mystery', y: 15 },
        { name: 'History', y: 10 },
        { name: 'Other', y: 5 }
      ]
    }]
  };

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadApprovedBooks();
    this.loadRecentBooks();
  }

  constructor(
    private commonService: CommonService
  ){}

  loadApprovedBooks(): void {
    const userId = this.currentUser?.id;
    if (!userId) {
      this.error = 'User not logged in';
      return;
    }

    this.borrowRequestService.getBorrowRequestsByUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => this.borrowRequests.set(requests),
        error: () => this.error = 'Failed to load borrow requests'
      });

    this.bookService.getAllBooks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books) => this.books.set(books),
        error: () => this.error = 'Failed to load books'
      });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
