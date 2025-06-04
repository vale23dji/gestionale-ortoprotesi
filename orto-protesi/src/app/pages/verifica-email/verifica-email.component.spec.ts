import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificaEmailComponent } from './verifica-email.component';

describe('VerificaEmailComponent', () => {
  let component: VerificaEmailComponent;
  let fixture: ComponentFixture<VerificaEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificaEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificaEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
