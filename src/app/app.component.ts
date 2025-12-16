// src/app/app.component.ts

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Investment Planning Suite';

  // Define the available tabs (must match the buttons and the *ngIf conditions in HTML)
  activeTab: 'SIP' | 'Lumpsum' | 'StepUpSIP' | 'SWP' | 'Combined' = 'SIP';

  // Array to drive the navigation buttons
  tabs = [
    { name: 'Standard SIP', value: 'SIP' },
    { name: 'Lumpsum', value: 'Lumpsum' },
    { name: 'Step-Up SIP', value: 'StepUpSIP' },
    { name: 'SWP', value: 'SWP' },
    { name: 'Lumpsum + SIP', value: 'Combined' },
  ];

  /**
   * Sets the active tab based on the button clicked.
   * @param tab The value of the tab to make active.
   */
  setActiveTab(
    tab: 'SIP' | 'Lumpsum' | 'StepUpSIP' | 'SWP' | 'Combined'
  ): void {
    this.activeTab = tab;
  }
}
