import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorynotUserComponent } from './categorynot-user.component';

describe('CategorynotUserComponent', () => {
  let component: CategorynotUserComponent;
  let fixture: ComponentFixture<CategorynotUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorynotUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategorynotUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
