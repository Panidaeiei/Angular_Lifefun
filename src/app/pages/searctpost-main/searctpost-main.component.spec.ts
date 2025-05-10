import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearctpostMainComponent } from './searctpost-main.component';

describe('SearctpostMainComponent', () => {
  let component: SearctpostMainComponent;
  let fixture: ComponentFixture<SearctpostMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearctpostMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearctpostMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
