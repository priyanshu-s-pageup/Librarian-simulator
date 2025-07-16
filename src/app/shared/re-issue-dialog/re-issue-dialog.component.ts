import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorrowRequest } from '../../models/borrow-request.model';
import { BorrowStatus } from '../../models/borrow-status.enum';
import { BorrowNotificationService } from '../../borrow-notification.service';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ExtendedRequest } from '../../models/extended-request.model';

@Component({
  selector: 'app-re-issue-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './re-issue-dialog.component.html',
  styleUrl: './re-issue-dialog.component.css',
})
export class ReIssueDialogComponent {
  private borrowService = inject(BorrowNotificationService);
  public reIssueRequests: BorrowRequest[] = [];
  public a = signal<ExtendedRequest[]>([]);

  ngOnInit(): void {
    this.loadReIssueRequests();
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {},
    private dialog: MatDialog
  ) {}

  public loadReIssueRequests(): void {
    this.borrowService.getIssueRequest().subscribe((allBooks) => {
      this.a.set(allBooks)
    });
  }

  // public newArray: ExtendedRequest[] = [...this.a()];


  public filteredOnes(): ExtendedRequest[] {
    const newArray: ExtendedRequest[] = [...this.a()];
    const fillerbro = newArray.filter(
      (noice) => noice.reRequest == BorrowStatus.Pending
    )

    console.log("newArray:", newArray);
    console.log("Filtered Ji: ", fillerbro);

    return fillerbro;
  }



  public onLendB(request: ExtendedRequest): void {
    this.borrowService
      .updateReIssueDetails(
        request.id,
        request.newDeadline,
        request.newDuration,
        BorrowStatus.Approved
      )
      .subscribe({
        next: () => {
          this.removeRequestFromUI(request.id);
        },
        error: (err) => {
          console.error('Failed to approve request:', err);
        },
      });
  }

  public onDenyB(request: ExtendedRequest): void {
    this.borrowService.updateReIssueDetails2(request.id, BorrowStatus.Denied).subscribe({
      next: () => {
        this.removeRequestFromUI(request.id);
      },
      error: (err) => {
        console.error('Failed to deny request:', err);
      },
    });
  }

  @Output() allRequestsHandled = new EventEmitter<void>();

  private removeRequestFromUI(requestId: string | undefined): void {
    const newArray: ExtendedRequest[] = [...this.a()];
    this.a.set(newArray.filter(
      (req) => req.id !== requestId
    ));
    this.a.set(newArray.filter(
      (req) => req.id !== requestId
    ));

    if (this.a().length === 0) {
      this.allRequestsHandled.emit(); //
    }

    if (this.a().length === 0) {
      this.allRequestsHandled.emit(); //
    }
  }
}
