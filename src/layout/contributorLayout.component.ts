import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-contributor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contributorLayout.component.html',
})
export class ContributorLayoutComponent {}