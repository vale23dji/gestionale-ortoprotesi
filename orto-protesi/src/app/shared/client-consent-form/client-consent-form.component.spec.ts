import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientConsentFormComponent } from './client-consent-form.component';

describe('ClientConsentFormComponent', () => {
  let component: ClientConsentFormComponent;
  let fixture: ComponentFixture<ClientConsentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientConsentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientConsentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
