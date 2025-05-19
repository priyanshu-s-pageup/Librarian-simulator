import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreBooksComponent } from './explore-books.component';

describe('ExploreBooksComponent', () => {
  let component: ExploreBooksComponent;
  let fixture: ComponentFixture<ExploreBooksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreBooksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreBooksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
