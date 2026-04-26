import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CONTINENT_OPTIONS } from '../../../core/location-continents';
import { LocationPreferenceService } from '../../../core/services/location-preference.service';
import { CityAutocompleteComponent } from '../city-autocomplete/city-autocomplete.component';

@Component({
  selector: 'app-publish-location-step',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, CityAutocompleteComponent],
  template: `
    <div class="publish-loc">
      <h4 class="publish-loc-title">{{ 'location.stepTitle' | translate }}</h4>
      <p class="publish-loc-hint text-muted">{{ 'location.stepHint' | translate }}</p>

      <div class="form-group">
        <label class="form-label">{{ 'location.continent' | translate }}</label>
        <select class="form-control" [(ngModel)]="continent" name="pubCont">
          <option value="">{{ 'location.continentPick' | translate }}</option>
          <option *ngFor="let o of continentOpts" [value]="o.code">{{ o.labelKey | translate }}</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">{{ 'location.city' | translate }}</label>
        <app-city-autocomplete
          name="pubCity"
          [(ngModel)]="city"
          [placeholder]="'location.cityPlaceholder' | translate"
        ></app-city-autocomplete>
      </div>

      <div class="publish-loc-actions">
        <button type="button" class="btn btn-secondary" (click)="skip()">{{ 'location.later' | translate }}</button>
        <button type="button" class="btn btn-primary" (click)="go()" [disabled]="!canGo">
          {{ 'location.continue' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .publish-loc { padding: 4px 0 8px; }
    .publish-loc-title { margin: 0 0 6px; font-size: 1.05rem; }
    .publish-loc-hint { margin: 0 0 14px; font-size: 0.9rem; line-height: 1.4; }
    .publish-loc-actions {
      display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; margin-top: 16px;
    }
  `]
})
export class PublishLocationStepComponent implements OnInit {
  @Output() confirmed = new EventEmitter<{ continent: string; city: string }>();
  @Output() skipped = new EventEmitter<void>();

  continent = '';
  city = '';
  continentOpts = CONTINENT_OPTIONS;

  constructor(
    private loc: LocationPreferenceService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    const p = this.loc.get();
    this.continent = p.continent;
    this.city = p.city;
  }

  get canGo(): boolean {
    return !!String(this.continent || '').trim() && !!String(this.city || '').trim();
  }

  go() {
    if (!this.canGo) return;
    const c = String(this.continent).trim();
    const t = String(this.city || '').trim();
    this.loc.set(c, t);
    this.confirmed.emit({ continent: c, city: t });
  }

  skip() {
    this.skipped.emit();
  }
}
