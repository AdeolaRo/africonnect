import { Component, ElementRef, forwardRef, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { CityResult, CityService } from '../../../core/services/city.service';

@Component({
  selector: 'app-city-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CityAutocompleteComponent),
      multi: true
    }
  ],
  template: `
    <div class="city-wrap">
      <input
        class="form-control"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (focus)="onFocus()"
        autocomplete="off"
      >

      <div class="city-list" *ngIf="open && results.length">
        <button type="button" class="city-item" *ngFor="let r of results" (click)="select(r)">
          {{ r.label }}
        </button>
      </div>
    </div>
  `
})
export class CityAutocompleteComponent implements ControlValueAccessor {
  @Input() placeholder = 'Ville';

  value = '';
  disabled = false;
  open = false;
  results: CityResult[] = [];

  private term$ = new Subject<string>();
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private cities: CityService, private el: ElementRef) {
    this.term$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) => this.cities.search(q))
      )
      .subscribe((items) => {
        this.results = items || [];
        this.open = this.value.trim().length >= 2 && this.results.length > 0;
      });
  }

  writeValue(v: any): void {
    this.value = String(v || '');
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(e: any) {
    const next = String(e?.target?.value || '');
    this.value = next;
    this.onChange(next);
    this.term$.next(next);
  }

  onFocus() {
    if (this.results.length) this.open = true;
  }

  select(r: CityResult) {
    this.value = String(r?.label || '');
    this.onChange(this.value);
    this.onTouched();
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const host = this.el?.nativeElement as HTMLElement;
    if (!host) return;
    if (!host.contains(ev.target as any)) {
      this.open = false;
      this.onTouched();
    }
  }
}

