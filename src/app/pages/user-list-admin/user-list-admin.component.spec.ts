import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserListAdminComponent } from './user-list-admin.component';

describe('UserListAdminComponent', () => {
  let component: UserListAdminComponent;
  let fixture: ComponentFixture<UserListAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserListAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserListAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
