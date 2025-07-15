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
import { MatIcon } from '@angular/material/icon';
import { ReIssueDialogComponent } from '../../../shared/re-issue-dialog/re-issue-dialog.component';
import { BorrowStatus } from '../../../models/borrow-status.enum';
@Component({
  selector: 'app-admin-notify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatProgressSpinner,
    MatCard,
    MatIcon,
  ],
  templateUrl: './admin-notify.component.html',
  styleUrls: ['./admin-notify.component.css'],
})
export class AdminNotifyComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private borrowService = inject(BorrowNotificationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  public borrowRequests = signal<BorrowRequest[]>([]);
  public reIssueRequests: BorrowRequest[] = [];

  public userMap = signal<Map<string, User>>(new Map());
  public isLoading = signal(true);
  public currentUser = signal<User | null>(null);

  public reIssueUserIds = signal<string[]>([]);

  private readonly snackBarConfig: MatSnackBarConfig = { duration: 4000 };

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadRequestsWithUsers();
    this.loadReIssueRequests();
  }

  public updateReIssueUserIds() {
    const reIssuedIds = this.borrowRequests()
      .filter((req) => req.reRequest)
      .map((req) => req.userId);

    this.reIssueUserIds.set(reIssuedIds);
  }

  public patchBorrowRequest(updatedRequest: BorrowRequest) {
    const updatedRequests = this.borrowRequests().map((req) =>
      req.userId === updatedRequest.userId ? updatedRequest : req
    );
    this.borrowRequests.set(updatedRequests);

    this.updateReIssueUserIds.call(this);
  }

  uniqueUserIds = computed(() => {
    const ids = this.borrowRequests().map((req) => req.userId);
    return [...new Set(ids)];
  });

  loadRequestsWithUsers(): void {
    this.borrowService
      .getBorrowRequests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (requests) => {
          this.borrowRequests.set(requests);
          const userIds = [...new Set(requests.map((req) => req.userId))];
          this.loadUsers(userIds);
        },
        error: () => {
          this.snackBar.open(
            'Failed to load requests.',
            'Close',
            this.snackBarConfig
          );
          this.isLoading.set(false);
        },
      });
  }

  private loadReIssueRequests(): void {
    this.borrowService.getReIssueRequest().subscribe((allRequests) => {
      console.log('All Requests: ', allRequests);
      this.reIssueRequests = allRequests.filter(
        (req) => req.reRequest === BorrowStatus.Pending
      );
      console.log("ReIssueRequests: (Kaddu)", this.reIssueRequests);
    });
  }

  loadUsers(userIds: string[]): void {
    const query = userIds.map((id) => `id=${id}`).join('&');
    this.http
      .get<User[]>(`http://localhost:3000/users?${query}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        const map = new Map<string, User>();
        users.forEach((user) => map.set(user.id, user)); //why +user.id
        this.userMap.set(map);
        this.isLoading.set(false);
      });
  }

  public openReIssueDialog() {
    this.dialog.open(ReIssueDialogComponent, {
      width: '500px',
      data: {},
    });
  }

  openUserDialog(userId: string): void {
    const dialogRef = this.dialog.open(ViewUserRequestsDialogComponent, {
      width: '500px',
      data: { userId },
    });

    dialogRef.componentInstance.allRequestsHandled.subscribe(() => {
      // Remove borrow requests for this user from the parent state
      const remaining = this.borrowRequests().filter(
        (req) => req.userId !== userId
      );
      this.borrowRequests.set(remaining);
    });
  }

  public getUserRequestCount(userId: string): number {
    return this.borrowRequests().filter((req) => req.userId === userId).length;
  }

  public getReIssueRequestCount(): number {
    return this.borrowRequests().filter(
      (req) => req.reRequest === BorrowStatus.Pending
    ).length;
  }

  public logout(): void {
    this.authService.logout();
  }
}
