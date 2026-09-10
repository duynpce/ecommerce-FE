import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

type Category = {
  name: string;
  description: string;
  icon: string;
  value: string;
  tone: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly router = inject(Router);

  readonly searchTerm = signal('');
  readonly roles = signal<string[]>(this.readRoles());

  readonly isAdmin = computed(
    () => this.roles().includes('ADMIN') || this.roles().includes('SUPER_ADMIN'),
  );

  readonly primaryDestination = computed(() =>
    this.isAdmin() ? '/admin' : '/user/products',
  );

  readonly primaryLabel = computed(() =>
    this.isAdmin() ? 'Open admin dashboard' : 'Explore the market',
  );

  readonly categories: Category[] = [
    { name: 'Home & living', description: 'Everyday pieces with character', icon: '⌂', value: 'HOME_AND_KITCHEN', tone: 'bg-[#e7d8c5]' },
    { name: 'Electronics', description: 'Clever tech for modern life', icon: '◉', value: 'ELECTRONICS', tone: 'bg-[#cddcd4]' },
    { name: 'Style', description: 'Wear it your own way', icon: '✦', value: 'CLOTHING', tone: 'bg-[#e6c9bd]' },
    { name: 'Books', description: 'Stories worth slowing down for', icon: '▤', value: 'BOOKS', tone: 'bg-[#d8d5c2]' },
    { name: 'Beauty & care', description: 'Feel-good daily rituals', icon: '✺', value: 'BEAUTY_AND_HEALTH', tone: 'bg-[#ead7dc]' },
    { name: 'Everything else', description: 'Unexpected finds, all in one place', icon: '∞', value: 'ELSE', tone: 'bg-[#d4dced]' },
  ];

  updateSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  search(event?: Event): void {
    event?.preventDefault();
    const name = this.searchTerm().trim();
    this.router.navigate(['/user/products'], {
      queryParams: name ? { name } : undefined,
    });
  }

  browseCategory(category: string): void {
    this.router.navigate(['/user/products'], { queryParams: { category } });
  }

  private readRoles(): string[] {
    try {
      const raw = localStorage.getItem('roles');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
