import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductSnapshotResponse, SnapshotStatus } from '../service/sub-order.service.type';

interface ProgressStage {
  key: SnapshotStatus | 'REVIEW';
  label: string;
}

@Component({
  selector: 'app-snapshot-item-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './snapshotItemCard.component.html',
})
export class SnapshotItemCardComponent {
  readonly item = input.required<ProductSnapshotResponse>();

  readonly stages: ProgressStage[] = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'PACKING', label: 'Packing' },
    { key: 'DELIVERING', label: 'Delivering' },
    { key: 'DELIVERED_AWAITING_CONFIRMATION', label: 'Confirm delivery' },
    { key: 'RECEIVED', label: 'Received' },
    { key: 'REVIEW', label: 'Review' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  readonly terminalStatus = computed(() =>
    ['REJECTED', 'CANCELLED', 'RETURNED'].includes(this.item().status),
  );

  private stageIndex(status: SnapshotStatus | 'REVIEW'): number {
    const index = this.stages.findIndex((stage) => stage.key === status);
    if (index >= 0) return index;
    return status === 'RETURNED' ? 3 : 0;
  }

  isReached(stage: SnapshotStatus | 'REVIEW'): boolean {
    if (stage === 'REVIEW') {
      return this.item().status === 'RECEIVED' || this.item().status === 'COMPLETED';
    }
    if (stage === 'COMPLETED') {
      return this.item().status === 'COMPLETED';
    }
    return this.stageIndex(stage) <= this.stageIndex(this.item().status);
  }

  isCurrent(stage: SnapshotStatus | 'REVIEW'): boolean {
    if (this.terminalStatus()) return false;
    if (stage === 'REVIEW') {
      return this.item().status === 'RECEIVED' && !this.item().isReviewed;
    }
    if (stage === 'COMPLETED') {
      return this.item().status === 'COMPLETED';
    }
    if (stage === 'RECEIVED' && this.item().status === 'RECEIVED') {
      return false;
    }
    return stage === this.item().status;
  }

  statusClass(status: SnapshotStatus): string {
    const classes: Record<SnapshotStatus, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      PACKING: 'bg-blue-100 text-blue-700',
      DELIVERING: 'bg-violet-100 text-violet-700',
      DELIVERED_AWAITING_CONFIRMATION: 'bg-indigo-100 text-indigo-700',
      RECEIVED: 'bg-cyan-100 text-cyan-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-slate-200 text-slate-700',
      RETURNED: 'bg-orange-100 text-orange-700',
    };
    return classes[status];
  }
}
