import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../../common.service';

@Component({
  selector: 'app-book-upsert',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './book-upsert.component.html',
  styleUrl: './book-upsert.component.css'
})
export class BookUpsertComponent implements OnInit {
  book: any = {
    title: '',
    author: '',
    genre: '',
    publishedYear: '',
    stockQuantity: 1,
    status: 'available'
  };

  originalBook: any = {};

  isEditMode = false;
  bookId: string | null = null;

  constructor(
    private service: CommonService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.isEditMode = true;
        this.bookId = idParam;
        this.service.getBookById(this.bookId).subscribe(data => {
          this.book = { ...data };

          //initializations of some extent!
          if (!this.book.stockQuantity) this.book.stockQuantity = 1;
          if (!this.book.status) this.book.status = 'available';
          this.originalBook = { ...this.book };
        })
      }
    });
  }

  goBack() {
    this.router.navigate(['/book-list']);
  }

  onSubmit() {
    // Update status based on stock quantity
    if (this.book.stockQuantity <= 0) {
      this.book.status = 'out-of-stock';
    } else if (this.book.stockQuantity < 3) {
      this.book.status = 'in-high-demand';
    } else {
      this.book.status = 'available';
    }

    if (this.isEditMode && this.bookId !== null) {
      this.service.updateBook(this.bookId, this.book).subscribe(() => {
        this.router.navigate(['/book-list']);
      });
    } else {
      this.service.AddData(this.book).subscribe(() => {
        this.router.navigate(['/book-list']);
      });
    }
  }

  hasChanges(): boolean {
    return JSON.stringify(this.book) !== JSON.stringify(this.originalBook);
  }
}
