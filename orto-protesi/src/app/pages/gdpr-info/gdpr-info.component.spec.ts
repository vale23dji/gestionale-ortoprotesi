import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GdprInfoComponent } from './gdpr-info.component';

describe('GdprInfoComponent', () => {
  let component: GdprInfoComponent;
  let fixture: ComponentFixture<GdprInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GdprInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GdprInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
