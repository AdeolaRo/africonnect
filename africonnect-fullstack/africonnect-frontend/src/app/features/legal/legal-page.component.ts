import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="item-card">
      <h1 style="margin-top:0;">{{ 'legal.termsTitle' | translate }} & {{ 'legal.conditionsTitle' | translate }}</h1>

      <div class="legal-text">
        <h3 style="margin-top:14px;">{{ 'legal.termsTitle' | translate }}</h3>
        <p>{{ 'legal.termsP1' | translate }}</p>
        <p>{{ 'legal.termsP2' | translate }}</p>
        <ul>
          <li>{{ 'legal.termsL1' | translate }}</li>
          <li>{{ 'legal.termsL2' | translate }}</li>
          <li>{{ 'legal.termsL3' | translate }}</li>
          <li>{{ 'legal.termsL4' | translate }}</li>
        </ul>
        <p>{{ 'legal.termsP3' | translate }}</p>

        <h3 style="margin-top:18px;">{{ 'legal.conditionsTitle' | translate }}</h3>

        <p><strong>{{ 'legal.conditionsS1Title' | translate }}</strong></p>
        <ul>
          <li>{{ 'legal.conditionsS1L1' | translate }}</li>
          <li>{{ 'legal.conditionsS1L2' | translate }}</li>
        </ul>

        <p><strong>{{ 'legal.conditionsS2Title' | translate }}</strong></p>
        <ul>
          <li>{{ 'legal.conditionsS2L1' | translate }}</li>
          <li>{{ 'legal.conditionsS2L2' | translate }}</li>
        </ul>

        <p><strong>{{ 'legal.conditionsS3Title' | translate }}</strong></p>
        <ul>
          <li>{{ 'legal.conditionsS3L1' | translate }}</li>
          <li>{{ 'legal.conditionsS3L2' | translate }}</li>
        </ul>

        <p><strong>{{ 'legal.conditionsS4Title' | translate }}</strong></p>
        <p>{{ 'legal.conditionsS4P1' | translate }}</p>
      </div>
    </div>
  `
})
export class LegalPageComponent {}

