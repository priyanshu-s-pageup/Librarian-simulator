import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { BorrowNotificationService } from '../../../borrow-notification.service';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinner, MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../auth/auth.service';
import { BorrowRequest } from '../../../models/borrow-request.model';
import { User } from '../../../auth/user.model';
import { ViewUserRequestsDialogComponent } from '../../../shared/view-user-requests-dialog/view-user-requests-dialog.component';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-admin-notify',
  standalone: true,
  imports:[CommonModule, FormsModule, MatButtonModule, MatProgressSpinner, MatCard],
  templateUrl: './admin-notify.component.html',
  styleUrls: ['./admin-notify.component.css']
})
export class AdminNotifyComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private borrowService = inject(BorrowNotificationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  borrowRequests = signal<BorrowRequest[]>([]);
  userMap = signal<Map<string, User>>(new Map());
  isLoading = signal(true);
  currentUser = signal<User | null>(null);

  private readonly snackBarConfig: MatSnackBarConfig = { duration: 4000 };

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadRequestsWithUsers();
  }

  uniqueUserIds = computed(() => {
    const ids = this.borrowRequests().map(req => req.userId);
    return [...new Set(ids)];
  });

  loadRequestsWithUsers(): void {
    this.borrowService.getBorrowRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          this.borrowRequests.set(requests);
          const userIds = [...new Set(requests.map(req => req.userId))];
          this.loadUsers(userIds);
        },
        error: () => {
          this.snackBar.open('Failed to load requests.', 'Close', this.snackBarConfig);
          this.isLoading.set(false);
        }
      });
  }

  loadUsers(userIds: string[]): void {
    const query = userIds.map(id => `id=${id}`).join('&');
    this.http.get<User[]>(`http://localhost:3000/users?${query}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => {
        const map = new Map<string, User>();
        users.forEach(user => map.set(user.id, user)); //why +user.id
        this.userMap.set(map);
        this.isLoading.set(false);
      });
  }


  openUserDialog(userId: string): void {
    const dialogRef = this.dialog.open(ViewUserRequestsDialogComponent, {
      width: '500px',
      data: { userId }
    });

    dialogRef.componentInstance.allRequestsHandled.subscribe(() => {
      // Remove borrow requests for this user from the parent state
      const remaining = this.borrowRequests().filter(req => req.userId !== userId);
      this.borrowRequests.set(remaining);
    });
  }

  getUserRequestCount(userId: string): number {
    return this.borrowRequests().filter(req => req.userId === userId).length;
  }


  logout(): void {
    this.authService.logout();
  }
}
