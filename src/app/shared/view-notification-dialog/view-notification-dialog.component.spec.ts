import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewNotificationDialogComponent } from './view-notification-dialog.component';

describe('ViewNotificationDialogComponent', () => {
  let component: ViewNotificationDialogComponent;
  let fixture: ComponentFixture<ViewNotificationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewNotificationDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewNotificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
