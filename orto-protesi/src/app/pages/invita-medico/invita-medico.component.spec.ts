import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvitaMedicoComponent } from './invita-medico.component';

describe('InvitaMedicoComponent', () => {
  let component: InvitaMedicoComponent;
  let fixture: ComponentFixture<InvitaMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvitaMedicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvitaMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
