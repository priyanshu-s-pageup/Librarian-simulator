import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-re-request-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Re-request for "{{ data.bookTitle }}"</h2>
    <div mat-dialog-content>
      <textarea [(ngModel)]="message" rows="5" class="form-control" placeholder="Write your message..."></textarea>
    </div>
    <div mat-dialog-actions class="mt-3">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-button color="primary" (click)="dialogRef.close(message)" [disabled]="!message.trim()">
        Send
      </button>
    </div>
  `
})
export class ReRequestDialogComponent {
  message = '';

  constructor(
    public dialogRef: MatDialogRef<ReRequestDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookTitle: string }
  ) {}
}
