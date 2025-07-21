import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Book } from '../book.component';
import { debounceTime, Subject } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../../common.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-book-list',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  searchTerm: string = '';
  currentSortField: string = 'title';
  currentSortOrder: 'ASC' | 'DESC' = 'ASC';
  currentPage: number = 1;
  pageSize: number = 10;
  totalBooks: number = 0;
  pageNumbers: number[] = [];
  loading: boolean = false; // Add this at the top of your class

  pageSizeOptions: number[] = [5, 10, 15, 20, 50];

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.fetchBooks();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.fetchBooks();
  }

  private searchSubject: Subject<string> = new Subject<string>();
  itemToDelete: Book | null = null;

  constructor(private CommonService: CommonService, private router: Router) {}

  ngOnInit(): void {
    this.fetchBooks();

    this.searchSubject.pipe(debounceTime(1000)).subscribe(() => {
      this.books = [];
      this.loading = true;
      this.currentPage = 1;
      this.fetchBooks();
    });
  }

  get totalPages(): number {
    return this.totalBooks > 0 ? Math.ceil(this.totalBooks / this.pageSize) : 1;
  }

  fetchBooks(): void {
    this.loading = true;
    this.CommonService.getBookDetails(
      this.currentPage,
      this.pageSize,
      this.currentSortField,
      this.currentSortOrder,
      this.searchTerm
    ).subscribe({
      next: (response) => {
        const data = response.body as Book[];
        this.books = data;
        const totalCount = response.headers.get('X-Total-Count');
        this.totalBooks = totalCount ? +totalCount : 0;
        this.calculatePagination();
      },
      error: (error) => {
        console.error('Error fetching books', error);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  // Status display helper methods
  getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      available: 'Available',
      'in-high-demand': 'High Demand',
      'out-of-stock': 'Out of Stock',
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      available: 'status-available',
      'in-high-demand': 'status-high-demand',
      'out-of-stock': 'status-out-of-stock',
    };
    return classMap[status] || '';
  }

  calculatePagination(): void {
    this.pageNumbers = [];
    const totalPages = this.totalPages;

    for (let i = 1; i <= totalPages; i++) {
      this.pageNumbers.push(i);
    }
  }

  onSearchChange(): void {
    this.loading = true;
    this.books = [];

    this.searchSubject.next(this.searchTerm);
  }

  sort(field: string): void {
    if (this.currentSortField === field) {
      this.currentSortOrder = this.currentSortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.currentSortField = field;
      this.currentSortOrder = 'ASC';
    }

    this.currentPage = 1;
    this.fetchBooks();
  }

  getSortIcon(field: string): string {
    if (this.currentSortField === field) {
      return this.currentSortOrder === 'ASC' ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchBooks();
    }
  }

  nextPage(): void {
    const maxPage = Math.ceil(this.totalBooks / this.pageSize);
    console.log(
      'totalBooks:',
      this.totalBooks,
      'pageSize:',
      this.pageSize,
      'maxPage:',
      maxPage
    );

    if (this.currentPage < maxPage) {
      this.currentPage++;
      console.log('next clicked. current page: ', this.currentPage);
      this.fetchBooks();
    } else {
      console.log('No more pages to load');
    }
  }

  addNewBook(): void {
    this.router.navigate(['/book-upsert']);
  }

  editItem(item: Book): void {
    this.router.navigate(['/book-upsert', item.id]);
  }

  openDeleteModal(item: Book): void {
    this.itemToDelete = item;
  }

  deleteItem(id?: string): void {
    if (!id) {
      console.warn('Delete attempted without ID');
      return;
    }

    this.CommonService.deleteBook(id).subscribe({
      next: () => this.fetchBooks(),
      error: (err) => console.error('Delete failed:', err),
    });
  }

  // Logic to handle file upload:

  public uploadFile() {
    this.router.navigate(['/app-file-upload-page']); //sample
  }
}
