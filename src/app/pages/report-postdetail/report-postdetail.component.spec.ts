import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportPostdetailComponent } from './report-postdetail.component';

describe('ReportPostdetailComponent', () => {
  let component: ReportPostdetailComponent;
  let fixture: ComponentFixture<ReportPostdetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportPostdetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportPostdetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
