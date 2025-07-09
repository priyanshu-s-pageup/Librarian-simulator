import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-view-notification-dialog',
  imports: [CommonModule, FormsModule, MatDialogContent, MatDialogActions],
  templateUrl: './view-notification-dialog.component.html',
  styleUrl: './view-notification-dialog.component.css'
})
export class ViewNotificationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ViewNotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
