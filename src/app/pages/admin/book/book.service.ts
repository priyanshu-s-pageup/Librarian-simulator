// book.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from './book.component';
import { BookData } from '../../user/explore-books/explore-books.component';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly apiUrl = 'http://localhost:3000/books';

  constructor(private http: HttpClient) {}

  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }
}
