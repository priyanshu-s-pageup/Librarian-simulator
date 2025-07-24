// borrow-request.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BorrowRequest } from './models/borrow-request.model';

@Injectable({ providedIn: 'root' })
export class BorrowRequestService {
  private readonly apiUrl = 'http://localhost:3000/borrowRequests';

  constructor(private http: HttpClient) {}

  getBorrowRequestsByUser(userId: string): Observable<BorrowRequest[]> {
    return this.http.get<BorrowRequest[]>(`${this.apiUrl}?userId=${userId}`);
  }

  getAllBorrowRequests(): Observable<BorrowRequest[]> {
    return this.http.get<BorrowRequest[]>(`${this.apiUrl}?_expand=book`);
  }


  createBorrowRequest(request: BorrowRequest) {
    return this.http.post<BorrowRequest>('http://localhost:3000/borrowRequests', request);
  }

}
