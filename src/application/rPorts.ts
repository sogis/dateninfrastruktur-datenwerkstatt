import type {REngine, RObjectRef, TransferPlan} from './ports';
import type {TableExportFormat} from './tableExport';
export type {TableExportFormat} from './tableExport';
/** Ephemeral export only: no project mutation or persistent capture. */
export interface RTableExportService {
  planExport(
    ref: RObjectRef,
    format: TableExportFormat,
    signal: AbortSignal,
  ): Promise<TransferPlan>;
  exportTable(
    planId: string,
    approvedIssues: string[],
    signal: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>>;
  discardExport(planId: string): void;
}
export interface ManagedREngine extends REngine {
  readonly epoch: number;
  readonly mutation: number;
}
export interface RLimits {
  timeoutMs: number;
  warningRows: number;
  hardRows: number;
  transferBytes: number;
}
