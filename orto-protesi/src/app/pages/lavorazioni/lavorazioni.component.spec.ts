import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LavorazioniComponent } from './lavorazioni.component';

describe('LavorazioniComponent', () => {
  let component: LavorazioniComponent;
  let fixture: ComponentFixture<LavorazioniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LavorazioniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LavorazioniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
