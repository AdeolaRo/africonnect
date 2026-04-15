import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="visible" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
          <h3>{{ title }}</h3>
          <button (click)="close()" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
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