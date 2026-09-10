import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-pagination-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paginationBar.component.html',
})
export class PaginationBarComponent {
  /** 0-based current page index */
  readonly currentPage = input.required<number>();
  /** Total number of pages */
  readonly totalPages  = input.required<number>();
  /** Emits the 0-based page index the user wants to navigate to */
  readonly pageChange  = output<number>();

  /**
   * Builds the list of page tokens to render.
   * Numbers are 0-based internally; the template adds 1 for display.
   * `null` represents an ellipsis gap.
   */
  readonly pageTokens = computed<(number | null)[]>(() => {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 1) return [];

    // For small page counts show everything
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    // Always show: first, last, current, and up to 1 neighbour on each side
    const visible = new Set<number>([
      0,
      total - 1,
      current,
      current - 1,
      current + 1,
    ]);

    const sorted = [...visible]
      .filter((p) => p >= 0 && p < total)
      .sort((a, b) => a - b);

    // Insert nulls where there are gaps > 1
    const result: (number | null)[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        result.push(null); // ellipsis
      }
      result.push(sorted[i]);
    }
    return result;
  });

  readonly isFirst = computed(() => this.currentPage() === 0);
  readonly isLast  = computed(() => this.currentPage() >= this.totalPages() - 1);

  go(page: number | null): void {
    if (page === null) return;
    if (page < 0 || page >= this.totalPages()) return;
    if (page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  prev(): void { this.go(this.currentPage() - 1); }
  next(): void { this.go(this.currentPage() + 1); }
}
