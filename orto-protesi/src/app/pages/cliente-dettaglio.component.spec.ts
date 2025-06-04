import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteDettaglioComponent } from './cliente-dettaglio.component';

describe('ClienteDettaglioComponent', () => {
  let component: ClienteDettaglioComponent;
  let fixture: ComponentFixture<ClienteDettaglioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteDettaglioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteDettaglioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
