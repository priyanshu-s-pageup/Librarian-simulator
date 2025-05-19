import { Component } from '@angular/core';
import { BookUpsertComponent } from './book-upsert/book-upsert.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-book',
  imports: [BookUpsertComponent, FormsModule, CommonModule],
  templateUrl: './book.component.html',
  styleUrl: './book.component.css'
})

export class BookComponent {

}

export interface Book {
  id?: string;
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  stockQuantity: number;
  status: 'available' | 'in-high-demand' | 'out-of-stock';
}
