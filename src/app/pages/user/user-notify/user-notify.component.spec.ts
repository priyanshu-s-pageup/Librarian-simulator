import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserNotifyComponent } from './user-notify.component';

describe('UserNotifyComponent', () => {
  let component: UserNotifyComponent;
  let fixture: ComponentFixture<UserNotifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserNotifyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserNotifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
