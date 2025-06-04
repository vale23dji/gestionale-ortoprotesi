import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvitaMedicoListComponent } from './invita-medico-list.component';

describe('InvitaMedicoListComponent', () => {
  let component: InvitaMedicoListComponent;
  let fixture: ComponentFixture<InvitaMedicoListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvitaMedicoListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvitaMedicoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
