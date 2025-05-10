import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCosmeticsComponent } from './user-cosmetics.component';

describe('UserCosmeticsComponent', () => {
  let component: UserCosmeticsComponent;
  let fixture: ComponentFixture<UserCosmeticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCosmeticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCosmeticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
