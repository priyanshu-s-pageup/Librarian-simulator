import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-activity',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-activity.component.html',
  styleUrls: ['./user-activity.component.css']
})
export class UserActivityComponent implements OnInit {

  // Dummy activity log data
  activityLogs: { date: string, activity: string, status: string }[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadActivityLogs();
  }

  loadActivityLogs(): void {
    // Example data, replace with real data from an API in the future
    this.activityLogs = [
      { date: '2025-07-01', activity: 'Logged in', status: 'Success' },
      { date: '2025-07-02', activity: 'Viewed Book: "The Silent Patient"', status: 'Success' },
      { date: '2025-07-03', activity: 'Borrowed Book: "1984"', status: 'Success' },
      { date: '2025-07-04', activity: 'Logged out', status: 'Success' },
      { date: '2025-07-05', activity: 'Failed Borrow Attempt: "Sapiens"', status: 'Failed' },
      { date: '2025-07-06', activity: 'Renewed Book: "Brave New World"', status: 'Success' }
    ];
  }

}
