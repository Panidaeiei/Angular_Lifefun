import { ComponentFixture, TestBed } from '@angular/core/testing';

import { STestComponent } from './s-test.component';

describe('STestComponent', () => {
  let component: STestComponent;
  let fixture: ComponentFixture<STestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [STestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(STestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
