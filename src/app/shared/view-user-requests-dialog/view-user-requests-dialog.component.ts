import { Component, EventEmitter, Inject, OnInit, Output, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { BorrowRequest } from '../../models/borrow-request.model';
import { BorrowNotificationService } from '../../borrow-notification.service';

@Component({
  selector: 'app-view-user-requests-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDialogModule, MatButtonModule],
  templateUrl: './view-user-requests-dialog.component.html',
  styleUrls: ['./view-user-requests-dialog.component.css']
})
export class ViewUserRequestsDialogComponent implements OnInit {
  borrowRequests: BorrowRequest[] = [];
  reIssueRequests: BorrowRequest[] = [];

  private borrowService = inject(BorrowNotificationService);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { userId: string }) {}

  ngOnInit(): void {
    this.loadRequests();
    this.loadReIssueRequests();
  }

  filterPendingRequests(): BorrowRequest[] {
    return this.borrowRequests.filter(request => request.status == "pending");
  }

  filterReIssueRequests(): BorrowRequest[] {
    return this.reIssueRequests.filter(request => request.reRequest === "pending");
  }

  private loadRequests(): void {
    this.borrowService.getBorrowRequests()
      .subscribe((allRequests) => {
        this.borrowRequests = allRequests.filter(req => req.userId === this.data.userId);
      });
  }

  private loadReIssueRequests(): void {
    this.borrowService.getReIssueRequest()
      .subscribe((allRequests) => {
        this.reIssueRequests = allRequests.filter(req => req.userId === this.data.userId);
      });
  }

onLend(request: BorrowRequest): void {
  this.borrowService.updateRequestStatus(request.id, 'approved').subscribe({
    next: () => {
      this.removeRequestFromUI(request.id);
    },
    error: (err) => {
      console.error('Failed to approve request:', err);
    }
  });
}

onLendB(request: BorrowRequest): void {
  this.borrowService.updateReIssueDetails(request.id, request.newDuration, 'approved').subscribe({
    next: () => {
      this.removeRequestFromUI(request.id);
    },
    error: (err) => {
      console.error('Failed to approve request:', err);
    }
  });
}

onDeny(request: BorrowRequest): void {
  this.borrowService.updateRequestStatus(request.id, 'denied').subscribe({
    next: () => {
      this.removeRequestFromUI(request.id);
    },
    error: (err) => {
      console.error('Failed to deny request:', err);
    }
  });
}

onDenyB(request: BorrowRequest): void {
  this.borrowService.updateReIssueDetails2(request.id, 'denied').subscribe({
    next: () => {
      this.removeRequestFromUI(request.id);
    },
    error: (err) => {
      console.error('Failed to deny request:', err);
    }
  });
}

@Output() allRequestsHandled = new EventEmitter<void>();

private removeRequestFromUI(requestId: number): void {
  this.borrowRequests = this.borrowRequests.filter(req => req.id !== requestId);
  this.reIssueRequests = this.reIssueRequests.filter(req => req.id !== requestId);

  if (this.borrowRequests.length === 0) {
    this.allRequestsHandled.emit();  //
  }

  if (this.reIssueRequests.length === 0) {
    this.allRequestsHandled.emit();  //
  }
}


}
