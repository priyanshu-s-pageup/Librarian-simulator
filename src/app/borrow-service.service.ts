// borrow.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class BorrowServiceService {
  readonly url = environment.apiUrl;

  constructor(private http: HttpClient) {}

  requestBorrow(bookId: number, duration: number): Observable<any> {
    return this.http.post(`${this.url}/borrowRequests`, {
      bookId,
      duration,
      status: 'pending'
    });
  }

  // approveBorrow(bookId: number): Observable<any> {
  //   return this.http.patch(`${this.url}/borrowRequests/${bookId}`, {
  //     status: 'approved'
  //   });
  // }

//   getBorrowRequests(): Observable<any[]> {
//     return this.http.get<any[]>(`${this.url}/borrowRequests?status=pending`);
//   }
}
