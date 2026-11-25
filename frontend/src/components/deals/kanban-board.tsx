'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { DEAL_STAGES, DEAL_STAGE_LABELS, type Deal, type DealStage, type PipelineBoard } from '@/types';

interface KanbanBoardProps {
  board?: PipelineBoard;
  isLoading?: boolean;
  onMoveStage: (dealId: string, stage: DealStage) => void;
  onSelectDeal: (deal: Deal) => void;
}

function DealCardContent({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
          {deal.title}
        </p>
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-semibold tabular-nums text-foreground">
        {formatCurrency(deal.value)}
      </p>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60 text-[11px] text-muted-foreground">
        <span className="truncate">
          {deal.company?.name ||
            (deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName}` : '—')}
        </span>
        {deal.expectedCloseDate && (
          <span className="shrink-0">{formatDate(deal.expectedCloseDate)}</span>
        )}
      </div>
    </div>
  );
}

function DraggableDealCard({ deal, onSelect }: { deal: Deal; onSelect: (d: Deal) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(deal)}
      className={cn(
        'cursor-grab rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-stone-300 active:cursor-grabbing',
        isDragging && 'opacity-35',
      )}
    >
      <DealCardContent deal={deal} />
    </div>
  );
}

function DroppableColumn({
  stage,
  deals,
  onSelectDeal,
}: {
  stage: DealStage;
  deals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const stageTotal = deals.reduce((acc, d) => acc + Number(d.value ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[420px] w-64 shrink-0 flex-col rounded-xl border border-border/80 bg-muted/40 p-2.5 transition-colors',
        isOver && 'border-stone-400 bg-stone-100/80',
      )}
    >
      <div className="flex items-center justify-between px-1.5 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-foreground">{DEAL_STAGE_LABELS[stage]}</span>
          <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
            {deals.length}
          </span>
        </div>
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
          {formatCurrency(stageTotal)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {deals.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/70 text-[11px] text-muted-foreground/70">
            Drop deal here
          </div>
        ) : (
          deals.map((deal) => (
            <DraggableDealCard key={deal.id} deal={deal} onSelect={onSelectDeal} />
          ))
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  board,
  isLoading,
  onMoveStage,
  onSelectDeal,
}: KanbanBoardProps) {
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  if (isLoading || !board) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <div
            key={stage}
            className="w-64 shrink-0 space-y-2.5 rounded-xl border border-border bg-muted/30 p-3"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as Deal | undefined;
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;
    const deal = active.data.current?.deal as Deal | undefined;
    const targetStage = over.id as DealStage;
    if (deal && DEAL_STAGES.includes(targetStage) && deal.stage !== targetStage) {
      onMoveStage(deal.id, targetStage);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3.5 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => (
          <DroppableColumn
            key={stage}
            stage={stage}
            deals={board[stage] ?? []}
            onSelectDeal={onSelectDeal}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? (
          <div className="w-60 rounded-xl border border-stone-300 bg-card p-3.5 shadow-lg">
            <DealCardContent deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
