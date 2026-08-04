import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  TransactionService,
  TransactionResponse,
  TransactionStatus,
} from '../../../shared/service/transaction.service';
import { TicketService } from '../../../shared/service/ticket.service';
import { ToastrService } from 'ngx-toastr';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';

// ---------------------------------------------------------------------------
// BPMN stage model
// Reflects the buying-items-procedure.bpmn flow:
//   buy → PENDING → (accept) → PACKING → (hand to transport) → DELIVERING
//                 → (reject) → REJECTED
//   DELIVERING → customer confirms → COMPLETED | RETURNED | NOT_RECEIVED(retry)
// ---------------------------------------------------------------------------

export interface Stage {
  /** The primary TransactionStatus that represents this stage being "active". */
  status: TransactionStatus;
  label: string;
  /** Small hint shown under the node when this stage is active. */
  hint?: string;
}

/** Ordered list of the forward-progress stages (no terminal branches). */
const BPMN_STAGES: Stage[] = [
  { status: 'PENDING',    label: 'New order',   hint: 'Awaiting your decision' },
  { status: 'PACKING',    label: 'Packing',     hint: 'Pack and hand to courier' },
  { status: 'DELIVERING', label: 'Delivering',  hint: 'In transit to customer' },
  { status: 'COMPLETED',  label: 'Completed',   hint: 'Customer confirmed receipt' },
];

/** Statuses that end the process with no further contributor action. */
const TERMINAL_STATUSES: TransactionStatus[] = [
  'COMPLETED', 'REJECTED', 'RETURNED', 'FAILED', 'REVERSED',
];

/**
 * Returns the ordinal position (0-based) of a status in the BPMN_STAGES array.
 * Returns -1 for statuses not in the main flow (REJECTED, RETURNED, etc.).
 */
function stageIndex(status: TransactionStatus): number {
  return BPMN_STAGES.findIndex(s => s.status === status);
}

@Component({
  selector: 'app-contributor-transaction-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DecimalPipe, DatePipe, NgClass],
  templateUrl: './contributorTransactionDetail.component.html',
})
export class ContributorTransactionDetailComponent implements OnInit {
  private readonly route              = inject(ActivatedRoute);
  private readonly router             = inject(Router);
  private readonly transactionService = inject(TransactionService);
  private readonly ticketService      = inject(TicketService);
  private readonly toastr             = inject(ToastrService);

  readonly ui          = UI_CLASS_NAME;
  readonly loading     = signal(false);
  readonly acting      = signal(false);
  readonly transaction = signal<TransactionResponse | null>(null);

  /** Expose stages to the template. */
  readonly stages: Stage[] = BPMN_STAGES;

  private txId!: string;

  ngOnInit(): void {
    this.txId = this.route.snapshot.paramMap.get('id')!;
    this.fetch();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  fetch(): void {
    this.loading.set(true);
    this.transactionService.findById(this.txId).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.transaction.set(res.data);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message ?? 'Failed to load order.');
        this.router.navigate(['/contributor/transactions']);
      },
    });
  }

  // ── BPMN stage helpers (used by the template) ─────────────────────────────

  /**
   * The stage node at `stageStatus` is "reached" when the current tx status
   * is at that stage or further along (including terminal).
   */
  isStageReached(stageStatus: TransactionStatus): boolean {
    const tx = this.transaction();
    if (!tx) return false;
    const txIdx    = stageIndex(tx.status);
    const stageIdx = stageIndex(stageStatus);
    // Terminal statuses that came through PACKING/DELIVERING count as reached
    if (txIdx === -1) {
      // REJECTED → only PENDING is reached
      if (tx.status === 'REJECTED')   return stageStatus === 'PENDING';
      // RETURNED → PENDING + PACKING + DELIVERING reached
      if (tx.status === 'RETURNED')   return ['PENDING','PACKING','DELIVERING'].includes(stageStatus);
      return false;
    }
    return stageIdx <= txIdx;
  }

  /** Stage node is "completed" when the tx has moved past it. */
  isStageCompleted(stageStatus: TransactionStatus, txStatus: TransactionStatus): boolean {
    const txIdx    = stageIndex(txStatus);
    const stageIdx = stageIndex(stageStatus);
    if (txIdx === -1) {
      if (txStatus === 'REJECTED')  return stageStatus === 'PENDING' && stageIdx < stageIndex('PENDING');
      if (txStatus === 'RETURNED')  return ['PENDING','PACKING'].includes(stageStatus);
      return false;
    }
    return stageIdx < txIdx;
  }

  /** Stage node is "active" (current step). */
  isStageActive(stageStatus: TransactionStatus, txStatus: TransactionStatus): boolean {
    return stageStatus === txStatus;
  }

  /** Stage is shown with an error indicator (only REJECTED on the PENDING node). */
  isStageFailed(stageStatus: TransactionStatus, txStatus: TransactionStatus): boolean {
    return txStatus === 'REJECTED' && stageStatus === 'PENDING';
  }

  /** CSS classes for the stage circle. */
  stageCircleClass(stageStatus: TransactionStatus, txStatus: TransactionStatus): string {
    if (this.isStageFailed(stageStatus, txStatus))
      return 'bg-red-100 text-red-600';
    if (this.isStageActive(stageStatus, txStatus))
      return 'bg-indigo-600 text-white';
    if (this.isStageCompleted(stageStatus, txStatus))
      return 'bg-emerald-500 text-white';
    return 'bg-slate-100 text-slate-400';
  }

  isTerminal(status: TransactionStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
  }

  terminalBannerClass(status: TransactionStatus): string {
    if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
    if (status === 'REJECTED')  return 'bg-red-50 text-red-700';
    if (status === 'RETURNED')  return 'bg-amber-50 text-amber-700';
    return 'bg-slate-50 text-slate-600';
  }

  statusClass(status: TransactionStatus): string {
    const map: Partial<Record<TransactionStatus, string>> = {
      PENDING:    'bg-amber-100 text-amber-700',
      PACKING:    'bg-blue-100 text-blue-700',
      DELIVERING: 'bg-violet-100 text-violet-700',
      COMPLETED:  'bg-emerald-100 text-emerald-700',
      REJECTED:   'bg-red-100 text-red-700',
      RETURNED:   'bg-slate-100 text-slate-600',
    };
    return map[status] ?? 'bg-slate-100 text-slate-600';
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * PENDING → PACKING
   * Calls the Camunda ticket service with approve = true.
   * The ticket service will automatically update the transaction status.
   */
  acceptOrder(): void {
    if (!confirm('Accept this order? It will move to the packing stage.')) return;
    this.acting.set(true);
    this.ticketService.confirmTransaction(this.txId, { approve: true }).subscribe({
      next: () => {
        this.acting.set(false);
        this.toastr.success('Order accepted — proceed to pack the item.');
        this.fetch();
      },
      error: (err) => {
        this.acting.set(false);
        this.toastr.error(err?.error?.message ?? 'Action failed. Please try again.');
      },
    });
  }

  /**
   * PENDING → REJECTED
   * Calls the Camunda ticket service with approve = false.
   * The ticket service will automatically update the transaction status.
   */
  rejectOrder(): void {
    if (!confirm('Reject this order? This cannot be undone.')) return;
    this.acting.set(true);
    this.ticketService.confirmTransaction(this.txId, { approve: false }).subscribe({
      next: () => {
        this.acting.set(false);
        this.toastr.success('Order rejected.');
        this.fetch();
      },
      error: (err) => {
        this.acting.set(false);
        this.toastr.error(err?.error?.message ?? 'Action failed. Please try again.');
      },
    });
  }

  /**
   * PACKING → DELIVERING
   * Calls the Camunda ticket service to confirm the item was handed to the carrier.
   * The ticket service will automatically update the transaction status.
   */
  markHandedToTransport(): void {
    if (!confirm('Confirm the item has been handed to the transport agency?')) return;
    this.acting.set(true);
    this.ticketService.confirmShipped(this.txId).subscribe({
      next: () => {
        this.acting.set(false);
        this.toastr.success('Marked as handed to transport — delivery in progress.');
        this.fetch();
      },
      error: (err) => {
        this.acting.set(false);
        this.toastr.error(err?.error?.message ?? 'Action failed. Please try again.');
      },
    });
  }
}