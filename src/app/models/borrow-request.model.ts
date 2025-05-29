import { BookData } from "../pages/user/explore-books/explore-books.component";

export interface BorrowRequest {
  id: number;
  bookId: number;
  userId: string;
  books: BookData;
  book: {
    id: number;
    title: string;
    author: string;
    stockQuantity: number;
    status: 'available' | 'in-high-demand' | 'out-of-stock';
  };
  user: {
    id: string;
    name: string;
  };
  duration: number;
  status: 'pending' | 'approved' | 'denied';
}
