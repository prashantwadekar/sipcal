import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepUpSipCalculatorComponent } from './step-up-sip-calculator.component';

describe('StepUpSipCalculatorComponent', () => {
  let component: StepUpSipCalculatorComponent;
  let fixture: ComponentFixture<StepUpSipCalculatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StepUpSipCalculatorComponent]
    });
    fixture = TestBed.createComponent(StepUpSipCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
