import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyConsentPopupComponent } from './privacy-consent-popup.component';

describe('PrivacyConsentPopupComponent', () => {
  let component: PrivacyConsentPopupComponent;
  let fixture: ComponentFixture<PrivacyConsentPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyConsentPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacyConsentPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
