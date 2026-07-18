import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '@/contexts/ThemeContext';
import { useNoteGraph } from '@/hooks/useNotes';
import type { NoteGraphNode } from '@/types/arrow';

interface NoteGraphViewProps {
  focusNoteId?: string | null;
  tagFilter?: string | null;
  onNodeClick: (id: string) => void;
}

type GraphNode = NoteGraphNode & { x?: number; y?: number };

export default function NoteGraphView({
  focusNoteId,
  tagFilter,
  onNodeClick,
}: NoteGraphViewProps) {
  const { theme } = useTheme();
  const [localFocus, setLocalFocus] = useState(!!focusNoteId);
  const effectiveFocus = localFocus && focusNoteId ? focusNoteId : null;
  const { data, isLoading } = useNoteGraph(effectiveFocus, tagFilter);
  const graphRef = useRef<{ zoomToFit: (ms?: number) => void } | null>(null);

  useEffect(() => {
    setLocalFocus(!!focusNoteId);
  }, [focusNoteId]);

  const graphData = useMemo(() => {
    if (!data) return { nodes: [] as GraphNode[], links: [] as { source: string; target: string }[] };
    return {
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.edges.map((e) => ({ source: e.source, target: e.target })),
    };
  }, [data]);

  useEffect(() => {
    const t = setTimeout(() => graphRef.current?.zoomToFit?.(400), 500);
    return () => clearTimeout(t);
  }, [graphData]);

  const paintNode = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.title;
      const r = Math.max(4, Math.min(14, 4 + node.linkCount * 1.5));
      ctx.beginPath();
      ctx.arc(node.x || 0, node.y || 0, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      if (globalScale > 0.8) {
        ctx.font = `${10 / globalScale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(label.slice(0, 24), node.x || 0, (node.y || 0) + r + 2);
      }
    },
    [theme],
  );

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20">
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Nenhuma conexão ainda. Crie wikilinks com [[Outra Nota]].
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[480px]">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs flex items-center gap-1.5" style={{ color: theme.textMuted }}>
          <input
            type="checkbox"
            checked={localFocus}
            onChange={(e) => setLocalFocus(e.target.checked)}
          />
          Só vizinhos da nota ativa
        </label>
        <button
          type="button"
          onClick={() => graphRef.current?.zoomToFit?.(400)}
          className="text-xs px-2 py-1 rounded-lg"
          style={{ background: theme.accentLight, color: theme.accent }}
        >
          Reset zoom
        </button>
      </div>
      <div className="flex-1 rounded-xl border overflow-hidden" style={{ borderColor: theme.border }}>
        <ForceGraph2D
          ref={graphRef}
          graphData={graphData}
          nodeId="id"
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as GraphNode;
            const r = Math.max(8, Math.min(18, 6 + n.linkCount * 1.5));
            ctx.beginPath();
            ctx.arc(n.x || 0, n.y || 0, r, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          linkColor={() => `${theme.accent}66`}
          onNodeClick={(node) => onNodeClick((node as GraphNode).id)}
          backgroundColor="transparent"
        />
      </div>
    </div>
  );
}
