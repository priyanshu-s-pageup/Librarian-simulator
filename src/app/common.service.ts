  import { Injectable } from '@angular/core';
  import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
  import { catchError, map, Observable, switchMap, throwError } from 'rxjs';
  import { environment } from '../environments/environment.development';
  import { Book } from './pages/admin/book/book.component';
  import { UserData } from './pages/admin/user-management/user-management.component';
  import { BookData } from './pages/user/explore-books/explore-books.component';

  @Injectable({
    providedIn: 'root'
  })
  export class CommonService {
    readonly url = environment.apiUrl;

    constructor(private http: HttpClient) {}

    AddData(data: any): Observable<any> {
      return this.http.post(`${this.url}/books`, data);
    }

    getBookDetails(
      page: number = 1,
      pageSize: number = 10,
      sortField: string = '',
      sortOrder: 'ASC' | 'DESC' = 'ASC',
      searchTerm: string = ''

    ): Observable<any> {

      const cleanSortField = sortField.startsWith('-') ? sortField.slice(1) : sortField;
      const order = sortField.startsWith('-') ? 'DESC' : sortOrder;

      let params = new HttpParams()
        .set('_page', page.toString())
        .set('_limit', pageSize.toString())
        .set('_sort', cleanSortField)
        .set('_order', order);

      if (searchTerm) {
        params = params.set('q', searchTerm);
      }

      return this.http.get<Book[]>(`${this.url}/books`, {
        params,
        observe: 'response',
      });
    }

    getBooks(
      searchTerm: string,
      page: number,
      pageSize: number,
      sortField: string,
      sortOrder: 'ASC' | 'DESC'
    ): Observable<HttpResponse<BookData[]>> {
      let params = new HttpParams()
        .set('_page', page.toString())
        .set('_limit', pageSize.toString())
        .set('_sort', sortField)
        .set('_order', sortOrder.toLowerCase());

      if (searchTerm) {
        params = params.set('q', searchTerm);
      }

      return this.http.get<BookData[]>(`${this.url}/books`, {
        params,
        observe: 'response'
      });
    }

    deleteBook(id: string): Observable<any> {
      return this.http.delete(`${this.url}/books/${id}`);
    }

    getBookById(id: string): Observable<Book> {
      return this.http.get<Book>(`${this.url}/books/${id}`);
    }

    updateBook(id: string, book: Book): Observable<any> {
      return this.http.put(`${this.url}/books/${id}`, book);
    }

    getSortedBooks(sortBy: string, order: 'ASC' | 'DESC'): Observable<any[]> {
      const params = new HttpParams()
        .set('_sort', sortBy)
        .set('_order', order);

      return this.http.get<any[]>(this.url, { params });
    }

    getTotalBooksCount(searchTerm: string = ''): Observable<number> {
      let params = new HttpParams();
      if (searchTerm) {
        params = params.set('q', searchTerm);
      }

      return this.http.get<Book[]>(`${this.url}/books`, { params }).pipe(
        map((books) => books.length)
      );
    }

    updateBookStock(bookId: string, quantityChange: number): Observable<Book> {
      return this.http.get<Book>(`${this.url}/books/${bookId}`).pipe(
        switchMap((currentBook) => {
          const newQuantity = currentBook.stockQuantity + quantityChange;
          if (newQuantity < 0) {
            return throwError(
              () =>
                new HttpErrorResponse({
                  status: 400,
                  error: { message: 'Insufficient stock' }
                })
            );
          }
          const newStatus =
            newQuantity === 0
              ? 'out-of-stock'
              : newQuantity <= 3
              ? 'in-high-demand'
              : 'available';
          return this.http.patch<Book>(`${this.url}/books/${bookId}`, {
            stockQuantity: newQuantity,
            status: newStatus
          });
        }),
        catchError((err) => {
          console.error('Error updating book stock:', err);
          return throwError(() => err);
        })
      );
    }

    processLend(bookId: string): Observable<Book> {
      return this.http.post<Book>(`${this.url}/books/${bookId}/lend`, {});
    }

    AddUser(userData: any): Observable<any> {
      const jsonData = this.formDataToJson(userData);
      return this.http.post(`${this.url}/users`, jsonData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      });
    }

    private formDataToJson(formData: FormData): any {
      const json: any = {};
      formData.forEach((value, key) => {
        if (value instanceof File) {
          json[key] = value.name;
        } else {
          json[key] = value;
        }
      });
      return json;
    }

    private handleError(error: HttpErrorResponse) {
      let errorMessage = 'An unknown error occurred';
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Client-side error: ${error.error.message}`;
      } else {
        errorMessage = `Server-side error: ${error.status} - ${error.message}`;
      }
      console.error(errorMessage);
      return throwError(() => new Error(errorMessage));
    }

    getLastUserId(): Observable<string> {
      return this.http.get<any[]>(`${this.url}/users?_sort=id&_order=desc&_limit=1`).pipe(
        map(users => users.length > 0 ? users[0].id : null)
      );
    }

    getUsers(
      searchTerm?: string,
      page: number = 1,
      pageSize: number = 10,
      sortField: string = '',
      sortOrder: 'ASC' | 'DESC' = 'ASC'

    ): Observable<HttpResponse<UserData[]>> {

      const cleanSortField = sortField.startsWith('-') ? sortField.slice(1) : sortField;
      const order = sortField.startsWith('-') ? 'DESC' : sortOrder;

      let params = new HttpParams()
        .set('_page', page.toString())
        .set('_limit', pageSize.toString())
        .set('_sort', cleanSortField)
        .set('_order', order);

      if (searchTerm) {
        params = params.set('search', searchTerm);
      }
      return this.http.get<UserData[]>(`${this.url}/users`, { params, observe: 'response', });
    }

    getUserById(id: string): Observable<any> {
      return this.http.get<any>(`${this.url}/users/${id}`);
    }

    updateUser(id: string, userData: any): Observable<any> {
      return this.http.put(`${this.url}/users/${id}`, userData);
    }

    deleteUser(id: string): Observable<any> {
      return this.http.delete(`${this.url}/users/${id}`);
    }

    getUsers2(): Observable<UserData[]> {
      return this.http.get<UserData[]>(`${this.url}/users`);
    }

    getUser(id: string): Observable<UserData> {
      return this.http.get<UserData>(`${this.url}/users/${id}`);
    }

    uploadImage(formData: FormData): Observable<{ filename: string }> {
      const file = formData.get('file') as File;

      return new Observable(observer => {
        const reader = new FileReader();

        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];

          const imagePayload = {
            filename: file.name,
            data: base64
          };

          this.http.post<{ id: number; filename: string; data: string }>(`${this.url}/images`, imagePayload)
            .subscribe({
              next: (res) => observer.next({ filename: res.filename }),
              error: (err) => observer.error(err),
              complete: () => observer.complete()
            });
        };

        reader.onerror = (err) => observer.error(err);
        reader.readAsDataURL(file);
      });
    }


  }
