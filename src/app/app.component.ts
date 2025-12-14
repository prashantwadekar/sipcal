// src/app/app.component.ts

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Investment Calculator Suite';
  activeTab: 'SIP' | 'Lumpsum' | 'StepUpSIP' | 'Combined' = 'SIP';

  setActiveTab(tab: 'SIP' | 'Lumpsum' | 'StepUpSIP' | 'Combined'): void {
    this.activeTab = tab;
  }
}