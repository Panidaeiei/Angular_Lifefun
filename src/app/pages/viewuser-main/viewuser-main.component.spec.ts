import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewuserMainComponent } from './viewuser-main.component';

describe('ViewuserMainComponent', () => {
  let component: ViewuserMainComponent;
  let fixture: ComponentFixture<ViewuserMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewuserMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewuserMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
