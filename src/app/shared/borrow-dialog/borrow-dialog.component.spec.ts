import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BorrowDialogComponent } from './borrow-dialog.component';

describe('BorrowDialogComponent', () => {
  let component: BorrowDialogComponent;
  let fixture: ComponentFixture<BorrowDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockData = {
    book: { id: '1', title: 'Test Book' },
    maxDuration: 30
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BorrowDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BorrowDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
