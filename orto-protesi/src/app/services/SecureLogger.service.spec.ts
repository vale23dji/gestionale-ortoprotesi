/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SecureLoggerService } from './SecureLogger.service';

describe('Service: SecureLogger', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SecureLoggerService]
    });
  });

  it('should ...', inject([SecureLoggerService], (service: SecureLoggerService) => {
    expect(service).toBeTruthy();
  }));
});
