import { BookData } from "../pages/user/explore-books/explore-books.component";

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
  timeLeft: number;
  status: 'pending' | 'approved' | 'denied' | 'returned';
  reRequest?: 'pending' | 'approved' | 'denied' | 'returned';
  createdAt: "2025-06-30T08:00:00.000Z",
}
