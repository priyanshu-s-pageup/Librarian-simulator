import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dialog',
  imports:[CommonModule, FormsModule, MatDialogContent, MatDialogActions],
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css']
})
export class UserDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public user: any, // user data passed into the dialog
    private router: Router
  ) {}

  // Close the dialog box
  onClose(): void {
    this.dialogRef.close();
  }

  // Navigate to the activity page
  checkActivity(): void {
    this.router.navigate(['/app-user-activity']);
    this.dialogRef.close(); // Close the dialog
  }

  // Open a dialog with the user's permissions
  openPermissions(): void {
    this.router.navigate(['/app-user-permissions', this.user.id]);
    this.dialogRef.close(); // Close the dialog
  }
}
