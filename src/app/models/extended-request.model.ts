import { BookData } from "../pages/user/explore-books/explore-books.component";
import { BorrowStatus } from "./borrow-status.enum";

export interface ExtendedRequest {
  id?: string | undefined;
  userId?: string;
  reIssueId?: string;
  bookId?: string;
  newDuration?: number;
  oldDeadline?: Date;
  newDeadline: Date;
  timeLeft: number;
  reRequest?: BorrowStatus;
  reIssueMessage?: string;
  book: {
    id?: string;
    title: string;
    author: string;
    stockQuantity?: number;
    status?: 'available' | 'in-high-demand' | 'out-of-stock';
  };
}
