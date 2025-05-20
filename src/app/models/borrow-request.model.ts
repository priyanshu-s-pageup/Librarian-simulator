export interface BorrowRequest {
  id: number;
  bookId: number;
  userId: string;
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
