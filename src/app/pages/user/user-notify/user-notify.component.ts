import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserNotificationService } from './user.notification.service';
import { ReRequestDialogComponent } from './re-request.dialog-component';

interface UserNotification {
  id: number;
  bookTitle: string;
  status: 'approved' | 'denied';
  isRead: boolean;
  hasReRequested: boolean;
  message?: string;
}

@Component({
  selector: 'app-user-notify',
  standalone: true,
  templateUrl: './user-notify.component.html',
  styleUrls: ['./user-notify.component.css'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule]
})
export class UserNotifyComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private notificationService = inject(UserNotificationService);
  private destroyRef = inject(DestroyRef);

  notifications = signal<UserNotification[]>([]);
  private readonly snackBarConfig: MatSnackBarConfig = { duration: 3000 };

  ngOnInit(): void {
    this.notificationService.getUserNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (notifications) => this.notifications.set(notifications),
        error: () => this.snackBar.open('Failed to load notifications', 'Close', this.snackBarConfig)
      });
  }

  markAsRead(notificationId: number): void {
    this.notificationService.markAsRead(notificationId).subscribe(() => {
      this.notifications.update(n =>
        n.map(notif => notif.id === notificationId ? { ...notif, isRead: true } : notif)
      );
    });
  }

  openReRequestDialog(notification: UserNotification): void {
    const dialogRef = this.dialog.open(ReRequestDialogComponent, {
      width: '350px',
      data: { bookTitle: notification.bookTitle }
    });

    dialogRef.afterClosed().subscribe((message: string | undefined) => {
      if (message) {
        this.notificationService.sendReRequest(notification.id, message).subscribe(() => {
          this.notifications.update(n =>
            n.map(notif => notif.id === notification.id ? { ...notif, hasReRequested: true } : notif)
          );
          this.snackBar.open('Re-request sent to admin', 'Close', this.snackBarConfig);
        });
      }
    });
  }
}
