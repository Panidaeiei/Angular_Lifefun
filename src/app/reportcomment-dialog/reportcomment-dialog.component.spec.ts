import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportcommentDialogComponent } from './reportcomment-dialog.component';

describe('ReportcommentDialogComponent', () => {
  let component: ReportcommentDialogComponent;
  let fixture: ComponentFixture<ReportcommentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportcommentDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportcommentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
