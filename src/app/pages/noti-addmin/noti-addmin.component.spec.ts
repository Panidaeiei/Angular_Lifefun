import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotiAddminComponent } from './noti-addmin.component';

describe('NotiAddminComponent', () => {
  let component: NotiAddminComponent;
  let fixture: ComponentFixture<NotiAddminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotiAddminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotiAddminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
