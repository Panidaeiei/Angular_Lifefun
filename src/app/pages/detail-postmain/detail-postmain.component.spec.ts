import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailPostmainComponent } from './detail-postmain.component';

describe('DetailPostmainComponent', () => {
  let component: DetailPostmainComponent;
  let fixture: ComponentFixture<DetailPostmainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailPostmainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailPostmainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
