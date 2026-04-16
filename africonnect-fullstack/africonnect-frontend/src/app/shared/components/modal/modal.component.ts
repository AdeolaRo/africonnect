import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button type="button" class="modal-close" (click)="close()" aria-label="Fermer">
            &times;
          </button>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() title = '';
  close() { this.visible = false; this.visibleChange.emit(false); }
}