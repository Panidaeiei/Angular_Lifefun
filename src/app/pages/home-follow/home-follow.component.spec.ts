import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeFollowComponent } from './home-follow.component';

describe('HomeFollowComponent', () => {
  let component: HomeFollowComponent;
  let fixture: ComponentFixture<HomeFollowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeFollowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeFollowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
