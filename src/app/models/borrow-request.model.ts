import { BookData } from "../pages/user/explore-books/explore-books.component";
import { BorrowStatus } from "./borrow-status.enum";

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
  newDuration?: number;
  startDate: Date;
  deadline: Date;
  newDeadline: Date;
  timeLeft: number;
  status: BorrowStatus;
  reRequest?: BorrowStatus;
  createdAt: Date;
  message: string;
}
