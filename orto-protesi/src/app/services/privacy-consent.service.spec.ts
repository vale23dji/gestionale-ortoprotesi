import { TestBed } from '@angular/core/testing';

import { PrivacyConsentService } from './privacy-consent.service';

describe('PrivacyConsentService', () => {
  let service: PrivacyConsentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrivacyConsentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
