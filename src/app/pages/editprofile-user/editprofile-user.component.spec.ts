import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditprofileUserComponent } from './editprofile-user.component';

describe('EditprofileUserComponent', () => {
  let component: EditprofileUserComponent;
  let fixture: ComponentFixture<EditprofileUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditprofileUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditprofileUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
