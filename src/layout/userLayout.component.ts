import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './userLayout.component.html',
})
export class UserLayoutComponent {
  private readonly roles = signal<string[]>(this.readRoles());

  readonly isContributor = computed(() => this.roles().includes('CONTRIBUTOR'));

  private readRoles(): string[] {
    try {
      const raw = localStorage.getItem('roles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

