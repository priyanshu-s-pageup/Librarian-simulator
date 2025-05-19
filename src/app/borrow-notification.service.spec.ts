import { TestBed } from '@angular/core/testing';

import { BorrowNotificationService } from './borrow-notification.service';

describe('BorrowNotificationService', () => {
  let service: BorrowNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BorrowNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
