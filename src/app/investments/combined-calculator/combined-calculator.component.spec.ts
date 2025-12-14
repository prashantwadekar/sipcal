import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinedCalculatorComponent } from './combined-calculator.component';

describe('CombinedCalculatorComponent', () => {
  let component: CombinedCalculatorComponent;
  let fixture: ComponentFixture<CombinedCalculatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CombinedCalculatorComponent]
    });
    fixture = TestBed.createComponent(CombinedCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
