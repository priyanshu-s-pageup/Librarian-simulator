import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewUserRequestsDialogComponent } from './view-user-requests-dialog.component';

describe('ViewUserRequestsDialogComponent', () => {
  let component: ViewUserRequestsDialogComponent;
  let fixture: ComponentFixture<ViewUserRequestsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewUserRequestsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewUserRequestsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
