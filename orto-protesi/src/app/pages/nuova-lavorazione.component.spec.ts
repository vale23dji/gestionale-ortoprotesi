import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuovaLavorazioneComponent } from './nuova-lavorazione.component';

describe('NuovaLavorazioneComponent', () => {
  let component: NuovaLavorazioneComponent;
  let fixture: ComponentFixture<NuovaLavorazioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuovaLavorazioneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuovaLavorazioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
