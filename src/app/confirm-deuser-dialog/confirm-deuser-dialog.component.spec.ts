import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeuserDialogComponent } from './confirm-deuser-dialog.component';

describe('ConfirmDeuserDialogComponent', () => {
  let component: ConfirmDeuserDialogComponent;
  let fixture: ComponentFixture<ConfirmDeuserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeuserDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDeuserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
