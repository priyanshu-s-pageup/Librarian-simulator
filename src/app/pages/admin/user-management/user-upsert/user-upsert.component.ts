import { Component, OnInit } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { lastValueFrom, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../../../common.service';
import { UserIdDialogComponent } from '../../../../shared/user-id-dialog.component';

@Component({
  selector: 'app-user-upsert',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './user-upsert.component.html',
  styleUrls: ['./user-upsert.component.css'],
})

/*

  There are 6 sections:

  1. Image Upload & Password
  2. Submit Button
  3. Password Strength
  4. Form Data Build-up
  5. Generate UserID
  6. Handle Image Upload

*/

export class UserUpsertComponent implements OnInit {
  public userForm: FormGroup;
  public selectedFile: File | null = null;
  public previewUrl: string | ArrayBuffer | null = null;
  public showPassword: boolean = false;
  public isSubmitting: boolean = false;

  public constructor(
    private readonly commonService: CommonService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar
  ) {
    this.userForm = new FormGroup({
      name: new FormControl ('', Validators.required),
      contact: new FormControl('',[Validators.required, Validators.pattern(/^[0-9]{10,15}$/)],),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('Pwd123', [Validators.required, Validators.minLength(6)]),
      image:new FormControl (''),
      role: new FormControl('user', Validators.required)
    });
  }

  public ngOnInit(): void {}

  // Go Back
  public goBack(): void {
    this.router.navigate(['/user-list']);
  }

  // Display User ID
  private showUserIdDialog(userId: string): void {
    this.dialog.open(UserIdDialogComponent, {
      data: { userId },
      width: '400px',
    });
  }

  private showSnackBar(
    message: string,
    panelClass: string,
    duration: number = 3000
  ): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: [panelClass],
    });
  }

  // 1. Image Upload & Password
  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
        this.userForm.patchValue({
          image: reader.result?.toString().split(',')[1],
        });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  //password
  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // 2. Submit Button
  public async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.showSnackBar(
        'Please fill all required fields correctly',
        'error-snackbar'
      );
      return;
    }

    this.isSubmitting = true;

    try {
      const userId = await lastValueFrom(this.generateUserId());
      const formData = this.buildFormData();
      formData.set('id', userId);
      formData.set('createdAt', new Date().toISOString());

      if (this.selectedFile) {
        const uploadResponse = await this.handleImageUpload();
        formData.set('image', uploadResponse.filename);
      }

      await lastValueFrom(this.commonService.AddUser(formData));
      this.showUserIdDialog(userId);
      this.router.navigate(['/user-list']);
    } catch (err: unknown) {
      this.handleSubmissionError(err);
    } finally {
      this.isSubmitting = false;
    }
  }


  // 3. Password Strength
  public getPasswordStrength(): { text: string; color: string } {
    const password = this.userForm.get('password')?.value;
    if (!password) return { text: '', color: 'black' };

    const strength = Math.min(6, Math.floor(password.length / 2));
    const strengths: { text: string; color: string }[] = [
      { text: 'Very Weak', color: 'red' },
      { text: 'Weak', color: 'orange' },
      { text: 'Moderate', color: 'yellow' },
      { text: 'Good', color: 'lightgreen' },
      { text: 'Strong', color: 'green' },
      { text: 'Very Strong', color: 'darkgreen' },
    ];

    return strengths[strength] || strengths[0];
  }

  // 4. Form Data Build-up
  private buildFormData(): FormData {
    const formData = new FormData();
    const formValues = this.userForm.value;

    Object.keys(formValues).forEach((key: string) => {
      if (key !== 'image' && formValues[key] !== null) {
        formData.append(key, formValues[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    return formData;
  }

  // 5. Generate UserID
  private generateUserId(): Observable<string> {
    return new Observable<string>((observer) => {
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const baseId = `${month}${day}US${now
        .getFullYear()
        .toString()
        .slice(-2)}`;

      this.commonService.getLastUserId().subscribe({
        next: (lastId: string) => {
          let seqNumber = 101;
          if (lastId && lastId.startsWith(baseId)) {
            const lastSeq = parseInt(lastId.replace(baseId, ''), 10);
            seqNumber = lastSeq + 1;
          }
          observer.next(`${baseId}${seqNumber.toString().padStart(3, '0')}`);
          observer.complete();
        },
        error: (err: Error) => {
          const seqNumber = Math.floor(Math.random() * 899) + 101;
          observer.next(`${baseId}${seqNumber.toString().padStart(3, '0')}`);
          observer.complete();
        },
      });
    });
  }

  // 6. Handle Image Upload
  private async handleImageUpload(): Promise<{ filename: string }> {
    if (!this.selectedFile) {
      throw new Error('No file selected for upload');
    }
    const uploadFormData = new FormData();
    uploadFormData.append('file', this.selectedFile);
    return lastValueFrom(this.commonService.uploadImage(uploadFormData));
  }

  private handleSubmissionError(err: unknown): void {
    const errorMessage =
      err instanceof HttpErrorResponse
        ? err.error?.message || err.message
        : 'Failed to save user data';
    this.showSnackBar(`Error: ${errorMessage}`, 'error-snackbar', 5000);
  }
}
