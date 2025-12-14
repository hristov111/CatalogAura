import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PricingComponent {
  @Input() theme: any = null;

  isYearly = false;

  toggleBilling() {
    this.isYearly = !this.isYearly;
  }
}

