import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-user-id-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>User Created Successfully</h2>
    <div mat-dialog-content>
      <p>Your User ID is:</p>
      <h3>{{ data.userId }}</h3>
      <p>Please note this ID for future reference.</p>
    </div>
    <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="true">OK</button>
    </div>
  `,
  styles: [`
    h3 {
      color: #3f51b5;
      text-align: center;
      font-size: 24px;
      margin: 10px 0;
    }
  `]
})
export class UserIdDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { userId: string }) {}
}