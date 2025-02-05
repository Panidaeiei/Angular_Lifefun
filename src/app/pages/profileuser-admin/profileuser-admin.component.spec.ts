import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileuserAdminComponent } from './profileuser-admin.component';

describe('ProfileuserAdminComponent', () => {
  let component: ProfileuserAdminComponent;
  let fixture: ComponentFixture<ProfileuserAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileuserAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileuserAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
