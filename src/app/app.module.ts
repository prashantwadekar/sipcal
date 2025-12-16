import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { SipCalculatorComponent } from './investments/sip-calculator/sip-calculator.component';
import { LumpsumCalculatorComponent } from './investments/lumpsum-calculator/lumpsum-calculator.component';
import { StepUpCalculatorComponent } from './investments/step-up-sip-calculator/step-up-sip-calculator.component';
import { CombinedCalculatorComponent } from './investments/combined-calculator/combined-calculator.component';
import { SwpCalculatorComponent } from './investments/swp-calculator/swp-calculator.component';

@NgModule({
  declarations: [
    AppComponent,
    SipCalculatorComponent,
    LumpsumCalculatorComponent,
    StepUpCalculatorComponent,
    CombinedCalculatorComponent,
    SwpCalculatorComponent,
  ],
  imports: [BrowserModule, FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
