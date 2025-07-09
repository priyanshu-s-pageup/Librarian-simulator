import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BookData } from '../../pages/user/explore-books/explore-books.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';

export interface BorrowDialogData {
  book: BookData;
  userId: string;
}

export interface BorrowDialogResult {
  duration: number;
  newDuration: number;
  userId: number;
  deadline: Date;
  newDeadline: Date;
}

@Component({
  selector: 'app-borrow-dialog',
  imports: [CommonModule, FormsModule, MatFormField, MatLabel],
  templateUrl: './borrow-dialog.component.html',
  styleUrls: ['./borrow-dialog.component.css']
})
export class BorrowDialogComponent {
  selectedDuration: number = 7; //default placeholder
  isSubmitting = false;
  public currentDate = new Date();

  constructor(
    public dialogRef: MatDialogRef<BorrowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BorrowDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onBorrow(): void {
    this.isSubmitting = true;

    const startDate = this.currentDate;
    const deadline = this.addDaysToCurrentDate(this.selectedDuration);
    const newDeadline = this.addDaysToCurrentDate(this.selectedDuration + this.selectedDuration);

    this.dialogRef.close({
      duration: this.selectedDuration,
      newDuration: this.selectedDuration,
      bookId: this.data.book.id,
      userId: this.data.userId,
      deadline: deadline,
      newDeadline: newDeadline,
      startDate: startDate
    });
  }

  addDaysToCurrentDate(days: number): Date {
    this.currentDate.setTime(this.currentDate.getTime() + (days * 24 * 60 * 60 * 1000));
    return this.currentDate;
  }

}
