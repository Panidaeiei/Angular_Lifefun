import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTravelComponent } from './user-travel.component';

describe('UserTravelComponent', () => {
  let component: UserTravelComponent;
  let fixture: ComponentFixture<UserTravelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserTravelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserTravelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
