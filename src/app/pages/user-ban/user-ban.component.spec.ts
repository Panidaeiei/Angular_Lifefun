import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBanComponent } from './user-ban.component';

describe('UserBanComponent', () => {
  let component: UserBanComponent;
  let fixture: ComponentFixture<UserBanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserBanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserBanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
