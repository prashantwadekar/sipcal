import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LumpsumCalculatorComponent } from './lumpsum-calculator.component';

describe('LumpsumCalculatorComponent', () => {
  let component: LumpsumCalculatorComponent;
  let fixture: ComponentFixture<LumpsumCalculatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LumpsumCalculatorComponent]
    });
    fixture = TestBed.createComponent(LumpsumCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
