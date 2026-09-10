import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shipper-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shipperLayout.component.html',
})
export class ShipperLayoutComponent {}
