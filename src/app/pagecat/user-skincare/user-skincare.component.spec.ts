import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserSkincareComponent } from './user-skincare.component';

describe('UserSkincareComponent', () => {
  let component: UserSkincareComponent;
  let fixture: ComponentFixture<UserSkincareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSkincareComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserSkincareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
