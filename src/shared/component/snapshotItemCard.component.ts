import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ProductSnapshotResponse,
  SnapshotStatus,
  SubOrderStatus,
} from '../service/sub-order.service.type';

type ProgressStageKey = SnapshotStatus | 'CONSOLIDATION' | 'REVIEW';

interface ProgressStage {
  key: ProgressStageKey;
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
  readonly subOrderStatus = input.required<SubOrderStatus>();

  readonly stages: ProgressStage[] = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'PACKING', label: 'Packing' },
    { key: 'CONSOLIDATION', label: 'All accepted' },
    { key: 'DELIVERING', label: 'Delivering' },
    { key: 'DELIVERED_AWAITING_CONFIRMATION', label: 'Confirm delivery' },
    { key: 'RECEIVED', label: 'Received' },
    { key: 'REVIEW', label: 'Review' },
    { key: 'COMPLETED', label: 'Completed' },
  ];

  readonly terminalStatus = computed(() =>
    ['REJECTED', 'CANCELLED', 'RETURNED'].includes(this.item().status),
  );

  readonly consolidationComplete = computed(() => {
    const orderStatus = this.subOrderStatus();
    const itemStatus = this.item().status;

    return (
      ['AWAITING_PICKUP', 'COMPLETED', 'RETURNED', 'PARTIALLY_RETURNED'].includes(orderStatus) ||
      ['DELIVERED_AWAITING_CONFIRMATION', 'RECEIVED', 'COMPLETED', 'RETURNED'].includes(itemStatus)
    );
  });

  private stageIndex(status: ProgressStageKey): number {
    const index = this.stages.findIndex((stage) => stage.key === status);
    if (index >= 0) return index;
    return status === 'RETURNED' ? 3 : 0;
  }

  isReached(stage: ProgressStageKey): boolean {
    if (stage === 'CONSOLIDATION') {
      return this.consolidationComplete();
    }
    if (stage === 'REVIEW') {
      return this.item().status === 'RECEIVED' || this.item().status === 'COMPLETED';
    }
    if (stage === 'COMPLETED') {
      return this.item().status === 'COMPLETED';
    }
    if (
      this.stageIndex(stage) > this.stageIndex('CONSOLIDATION') &&
      !this.consolidationComplete()
    ) {
      return false;
    }
    return this.stageIndex(stage) <= this.stageIndex(this.item().status);
  }

  isCurrent(stage: ProgressStageKey): boolean {
    if (this.terminalStatus()) return false;
    if (stage === 'CONSOLIDATION') {
      return (
        this.subOrderStatus() === 'WAITING_FOR_CONSOLIDATION' ||
        (this.item().status === 'DELIVERING' && !this.consolidationComplete())
      );
    }
    if (stage === 'REVIEW') {
      return this.item().status === 'RECEIVED' && !this.item().isReviewed;
    }
    if (stage === 'COMPLETED') {
      return this.item().status === 'COMPLETED';
    }
    if (stage === 'RECEIVED' && this.item().status === 'RECEIVED') {
      return false;
    }
    if (stage === 'DELIVERING' && !this.consolidationComplete()) {
      return false;
    }
    return stage === this.item().status;
  }

  isCompletedSuccess(stage: ProgressStageKey): boolean {
    return stage === 'COMPLETED' && this.item().status === 'COMPLETED';
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
