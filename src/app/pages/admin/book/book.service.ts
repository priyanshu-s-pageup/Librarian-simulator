// book.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { Book } from './book.component';
import { ExtendedRequest } from '../../../models/extended-request.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly url = 'http://localhost:3000/extendedRequests'
  private readonly apiUrl = 'http://localhost:3000/books';

  constructor(private http: HttpClient) {}

  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  getAllExtended(): Observable<ExtendedRequest[]> {
    return this.http.get<ExtendedRequest[]>(this.url);
  }

  getBookById(bookId: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${bookId}`);
  }

  updateBookStock(bookId: string | undefined, book: Book): Observable<Book> {
    const url = `${this.apiUrl}/${bookId}`;
    console.log('updatedBookStock successfully..');
    return this.http.put<Book>(url, book);
  }

  updateBook(
    bookId: string | undefined,
    updatedData: Partial<Book>
  ): Observable<Book> {
    return this.http.patch<Book>(`${this.apiUrl}/${bookId}`, updatedData);
  }

  updateDisabledReIssueUsers(
    bookId: string | undefined,
    userIdA: string
  ): Observable<any> {
    return this.http.get<Book>(`${this.apiUrl}/books/${bookId}`).pipe(
      switchMap((book) => {
        if (!book.disabledReIssueUsers) {
          book.disabledReIssueUsers = [];
        }

        book.disabledReIssueUsers.push(userIdA);

        return this.http.patch<Book>(`${this.apiUrl}/books/${book.id}`, {
          disabledReIssueUsers: book.disabledReIssueUsers,
        });
      })
    );
  }
}
