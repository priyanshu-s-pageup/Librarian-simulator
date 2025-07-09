import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';

@Component({
  selector: 'app-message-dialog',
  imports: [CommonModule, FormsModule, MatDialogContent, MatFormField, MatDialogActions, MatLabel, MatDialogClose ],
  templateUrl: './message-dialog.component.html',
  styleUrl: './message-dialog.component.css'
})
export class MessageDialogComponent {
   constructor(@Inject(MAT_DIALOG_DATA) public data: { message: string }) {}
}

