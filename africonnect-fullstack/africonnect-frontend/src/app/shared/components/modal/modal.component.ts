import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="dismissOnBackdrop && close()">
      <div class="modal-content" [ngClass]="sizeClass" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button *ngIf="showClose" type="button" class="modal-close" (click)="close()" [attr.aria-label]="'common.close' | translate">
            &times;
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class ModalComponent {
  /** `wide` = lecture détail (ex. Voir) ; `max` = très large bureautique */
  @Input() size: 'md' | 'wide' | 'max' = 'md';
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() title = '';
  @Input() dismissOnBackdrop = true;
  @Input() showClose = true;

  get sizeClass() {
    return this.size === 'md' ? '' : `modal--${this.size}`;
  }

  close() { this.visible = false; this.visibleChange.emit(false); }
}