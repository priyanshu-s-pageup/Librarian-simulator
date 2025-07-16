import { BookData } from '../pages/user/explore-books/explore-books.component';
import { BorrowStatus } from './borrow-status.enum';
import { ExtendedRequest } from './extended-request.model';

export interface BorrowRequest {
  id: number;
  bookId?: string;
  userId: string;
  books: BookData;
  book: {
    id?: string;
    title: string;
    author: string;
    stockQuantity?: number;
    status?: 'available' | 'in-high-demand' | 'out-of-stock';
  };
  user: {
    id: string;
    name: string;
  };
  duration: number;
  startDate: Date;
  deadline: Date;
  status: BorrowStatus;
  createdAt: Date;
  message: string;
  extendedRequest?: ExtendedRequest;
}
