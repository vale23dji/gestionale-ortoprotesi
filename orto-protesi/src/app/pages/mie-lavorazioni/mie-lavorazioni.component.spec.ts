import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MieLavorazioniComponent } from './mie-lavorazioni.component';

describe('MieLavorazioniComponent', () => {
  let component: MieLavorazioniComponent;
  let fixture: ComponentFixture<MieLavorazioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MieLavorazioniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MieLavorazioniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
