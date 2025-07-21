import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadPageComponent } from './file-upload-page.component';

describe('FileUploadPageComponent', () => {
  let component: FileUploadPageComponent;
  let fixture: ComponentFixture<FileUploadPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
