import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNotifyComponent } from './admin-notify.component';

describe('AdminNotifyComponent', () => {
  let component: AdminNotifyComponent;
  let fixture: ComponentFixture<AdminNotifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNotifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNotifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
