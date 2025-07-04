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

  constructor(
    public dialogRef: MatDialogRef<BorrowDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BorrowDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onBorrow(): void {
    this.isSubmitting = true;
    this.dialogRef.close({
      duration: this.selectedDuration,
      newDuration: this.selectedDuration,
      bookId: this.data.book.id,
      userId: this.data.userId,
    });
  }
}
