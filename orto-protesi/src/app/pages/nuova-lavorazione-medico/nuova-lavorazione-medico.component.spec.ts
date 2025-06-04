import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuovaLavorazioneMedicoComponent } from './nuova-lavorazione-medico.component';

describe('NuovaLavorazioneMedicoComponent', () => {
  let component: NuovaLavorazioneMedicoComponent;
  let fixture: ComponentFixture<NuovaLavorazioneMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuovaLavorazioneMedicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuovaLavorazioneMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
