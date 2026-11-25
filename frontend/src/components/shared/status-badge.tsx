import { cn } from '@/lib/utils';
import {
  DEAL_STAGE_LABELS,
  LEAD_STATUS_LABELS,
  ROLE_LABELS,
  TASK_STATUS_LABELS,
  type ActivityType,
  type DealStage,
  type LeadStatus,
  type Role,
  type TaskStatus,
} from '@/types';

const LEAD_STYLES: Record<LeadStatus, string> = {
  NEW: 'bg-stone-100 text-stone-700 border-stone-200',
  CONTACTED: 'bg-sky-50 text-sky-700 border-sky-200/70',
  QUALIFIED: 'bg-amber-50 text-amber-800 border-amber-200/70',
  UNQUALIFIED: 'bg-rose-50 text-rose-700 border-rose-200/70',
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
};

const DEAL_STYLES: Record<DealStage, string> = {
  LEAD: 'bg-stone-100 text-stone-700 border-stone-200',
  PROPOSAL: 'bg-sky-50 text-sky-700 border-sky-200/70',
  NEGOTIATION: 'bg-amber-50 text-amber-800 border-amber-200/70',
  CLOSED_WON: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  CLOSED_LOST: 'bg-rose-50 text-rose-700 border-rose-200/70',
};

const TASK_STYLES: Record<TaskStatus, string> = {
  PENDING: 'bg-stone-100 text-stone-700 border-stone-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200/70',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  CANCELLED: 'bg-stone-100 text-stone-400 border-stone-200 line-through',
};

const ACTIVITY_STYLES: Record<ActivityType, string> = {
  EMAIL: 'bg-sky-50 text-sky-700 border-sky-200/70',
  CALL: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
  MEETING: 'bg-violet-50 text-violet-700 border-violet-200/70',
  NOTE: 'bg-stone-100 text-stone-700 border-stone-200',
  TASK: 'bg-amber-50 text-amber-800 border-amber-200/70',
};

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-stone-900 text-stone-50 border-stone-900',
  MANAGER: 'bg-stone-200 text-stone-800 border-stone-300',
  SALES_REP: 'bg-stone-100 text-stone-700 border-stone-200',
  SUPPORT_AGENT: 'bg-sky-50 text-sky-700 border-sky-200/70',
  MARKETING: 'bg-amber-50 text-amber-800 border-amber-200/70',
};

const pillBase =
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap';

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span className={cn(pillBase, LEAD_STYLES[status], className)}>
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function DealStageBadge({ stage, className }: { stage: DealStage; className?: string }) {
  return (
    <span className={cn(pillBase, DEAL_STYLES[stage], className)}>
      {DEAL_STAGE_LABELS[stage]}
    </span>
  );
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span className={cn(pillBase, TASK_STYLES[status], className)}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

export function ActivityTypeBadge({ type, className }: { type: ActivityType; className?: string }) {
  return (
    <span className={cn(pillBase, ACTIVITY_STYLES[type], className)}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </span>
  );
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return <span className={cn(pillBase, ROLE_STYLES[role], className)}>{ROLE_LABELS[role]}</span>;
}
