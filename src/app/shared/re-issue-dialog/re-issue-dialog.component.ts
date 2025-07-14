import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, inject, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowRequest } from '../../models/borrow-request.model';
import { BorrowStatus } from '../../models/borrow-status.enum';
import { BorrowNotificationService } from '../../borrow-notification.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-re-issue-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './re-issue-dialog.component.html',
  styleUrl: './re-issue-dialog.component.css',
})
export class ReIssueDialogComponent {
  private borrowService = inject(BorrowNotificationService);

  public reIssueRequests: BorrowRequest[] = [];

  ngOnInit(): void {
    this.loadReIssueRequests();
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    private dialog: MatDialog
  ) {}

  private loadReIssueRequests(): void {
    this.borrowService.getReIssueRequest().subscribe((allRequests) => {
      this.reIssueRequests = allRequests.filter(
        (req) => req.userId === this.data.userId
      );
    });
  }

  filterReIssueRequests(): BorrowRequest[] {
    return this.reIssueRequests.filter(
      (request) => request.reRequest === BorrowStatus.Pending
    );
  }

  public onLendB(request: BorrowRequest): void {
    this.borrowService
      .updateReIssueDetails( request.id, request.createdAt, request.duration, request.newDuration, 'approved')
      .subscribe({
        next: () => {
          this.removeRequestFromUI(request.id);
        },
        error: (err) => {
          console.error('Failed to approve request:', err);
        },
      });
  }

  public onDenyB(request: BorrowRequest): void {
    this.borrowService.updateReIssueDetails2(request.id, 'denied').subscribe({
      next: () => {
        this.removeRequestFromUI(request.id);
      },
      error: (err) => {
        console.error('Failed to deny request:', err);
      },
    });
  }

  @Output() allRequestsHandled = new EventEmitter<void>();

  private removeRequestFromUI(requestId: number): void {
    this.reIssueRequests = this.reIssueRequests.filter(
      (req) => req.id !== requestId
    );
    this.reIssueRequests = this.reIssueRequests.filter(
      (req) => req.id !== requestId
    );

    if (this.reIssueRequests.length === 0) {
      this.allRequestsHandled.emit(); //
    }

    if (this.reIssueRequests.length === 0) {
      this.allRequestsHandled.emit(); //
    }
  }

}
