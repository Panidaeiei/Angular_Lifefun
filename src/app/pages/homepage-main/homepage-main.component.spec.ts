import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomepageMainComponent } from './homepage-main.component';

describe('HomepageMainComponent', () => {
  let component: HomepageMainComponent;
  let fixture: ComponentFixture<HomepageMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomepageMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomepageMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
