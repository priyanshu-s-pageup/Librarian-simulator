import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReIssueDialogComponent } from './re-issue-dialog.component';

describe('ReIssueDialogComponent', () => {
  let component: ReIssueDialogComponent;
  let fixture: ComponentFixture<ReIssueDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReIssueDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReIssueDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
