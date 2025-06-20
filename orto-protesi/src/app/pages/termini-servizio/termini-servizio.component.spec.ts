import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminiServizioComponent } from './termini-servizio.component';

describe('TerminiServizioComponent', () => {
  let component: TerminiServizioComponent;
  let fixture: ComponentFixture<TerminiServizioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminiServizioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminiServizioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
