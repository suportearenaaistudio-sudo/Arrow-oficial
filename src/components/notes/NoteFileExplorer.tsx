import { useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, FileText, Folder, FolderPlus, Plus, Search,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { Note } from '@/types/arrow';

interface NoteFileExplorerProps {
  notes: Note[];
  selectedId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelectNote: (note: Note) => void;
  selectedFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
  onNoteDragStart?: (e: React.DragEvent, note: Note) => void;
  onFolderDrop?: (e: React.DragEvent, folder: string | null) => void;
  onNewNote: () => void;
  onNewFolder: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  notes: Note[];
}

function buildTree(notes: Note[]): { roots: Note[]; folders: FolderNode[] } {
  const folderMap = new Map<string, FolderNode>();
  const roots: Note[] = [];

  function ensureFolder(path: string): FolderNode {
    if (!folderMap.has(path)) {
      const parts = path.split('/');
      const name = parts[parts.length - 1] || path;
      folderMap.set(path, { name, path, children: [], notes: [] });
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('/');
        ensureFolder(parentPath).children.push(folderMap.get(path)!);
      }
    }
    return folderMap.get(path)!;
  }

  for (const note of notes) {
    const folder = note.folder?.trim();
    if (!folder) roots.push(note);
    else ensureFolder(folder).notes.push(note);
  }

  const topFolders = [...folderMap.values()].filter((f) => !f.path.includes('/'));
  return { roots, folders: topFolders.sort((a, b) => a.name.localeCompare(b.name)) };
}

function FolderSection({
  node,
  depth,
  selectedId,
  selectedFolder,
  expandedFolders,
  onToggleFolder,
  onSelectNote,
  onFolderSelect,
  onNoteDragStart,
  onFolderDrop,
}: {
  node: FolderNode;
  depth: number;
  selectedId: string | null;
  selectedFolder: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectNote: (n: Note) => void;
  onFolderSelect: (f: string | null) => void;
  onNoteDragStart?: (e: React.DragEvent, note: Note) => void;
  onFolderDrop?: (e: React.DragEvent, folder: string | null) => void;
}) {
  const { theme } = useTheme();
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFolder === node.path;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onToggleFolder(node.path);
          onFolderSelect(isSelected ? null : node.path);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onFolderDrop?.(e, node.path)}
        className="w-full flex items-center gap-1 px-2 py-1 rounded-md text-left text-xs"
        style={{
          paddingLeft: 6 + depth * 10,
          background: isSelected ? theme.accentLight : 'transparent',
          color: theme.textPrimary,
        }}
      >
        {isExpanded ? (
          <ChevronRight className="w-3 h-3 rotate-90 shrink-0" style={{ color: theme.textMuted }} />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0" style={{ color: theme.textMuted }} />
        )}
        <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
        <span className="truncate">{node.name}</span>
      </button>
      {isExpanded && (
        <>
          {node.notes.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              depth={depth + 1}
              selected={selectedId === note.id}
              onSelect={() => onSelectNote(note)}
              onDragStart={onNoteDragStart}
            />
          ))}
          {node.children.map((child) => (
            <FolderSection
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              selectedFolder={selectedFolder}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSelectNote={onSelectNote}
              onFolderSelect={onFolderSelect}
              onNoteDragStart={onNoteDragStart}
              onFolderDrop={onFolderDrop}
            />
          ))}
        </>
      )}
    </div>
  );
}

function NoteRow({
  note,
  depth,
  selected,
  onSelect,
  onDragStart,
}: {
  note: Note;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart?: (e: React.DragEvent, note: Note) => void;
}) {
  const { theme, isDark } = useTheme();
  return (
    <button
      type="button"
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, note)}
      onClick={onSelect}
      className="w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-xs"
      style={{
        paddingLeft: 6 + depth * 10,
        background: selected
          ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
          : 'transparent',
        color: theme.textPrimary,
      }}
    >
      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: theme.textMuted }} />
      <span className="truncate">{note.title || 'Sem título'}</span>
    </button>
  );
}

export default function NoteFileExplorer({
  notes,
  selectedId,
  search,
  onSearchChange,
  onSelectNote,
  selectedFolder,
  onFolderSelect,
  onNoteDragStart,
  onFolderDrop,
  onNewNote,
  onNewFolder,
  collapsed,
  onToggleCollapse,
}: NoteFileExplorerProps) {
  const { theme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search) return notes;
    const q = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q));
  }, [notes, search]);

  const { roots, folders } = useMemo(() => buildTree(filtered), [filtered]);
  const showTree = !search;

  function toggleFolder(path: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  if (collapsed) {
    return (
      <div
        className="w-9 flex-shrink-0 border-r flex flex-col items-center py-2 gap-2"
        style={{ borderColor: theme.border }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg"
          style={{ color: theme.textMuted }}
          aria-label="Expandir explorer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-[260px] flex-shrink-0 flex flex-col h-full border-r"
      style={{ borderColor: theme.border }}
    >
      <div className="flex items-center gap-0.5 px-2 py-2 border-b" style={{ borderColor: theme.border }}>
        <button type="button" onClick={onNewNote} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }} title="Nova nota">
          <Plus className="w-4 h-4" />
        </button>
        <button type="button" onClick={onNewFolder} className="p-1.5 rounded-lg" style={{ color: theme.textMuted }} title="Nova pasta">
          <FolderPlus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="p-1.5 rounded-lg"
          style={{ color: searchOpen ? theme.accent : theme.textMuted }}
          title="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg ml-auto"
          style={{ color: theme.textMuted }}
          aria-label="Recolher explorer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {searchOpen && (
        <div className="px-2 py-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border text-xs outline-none"
            style={{ borderColor: theme.border, background: 'transparent' }}
            autoFocus
          />
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto py-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onFolderDrop?.(e, null)}
      >
        {showTree ? (
          <>
            {folders.map((folder) => (
              <FolderSection
                key={folder.path}
                node={folder}
                depth={0}
                selectedId={selectedId}
                selectedFolder={selectedFolder}
                expandedFolders={expandedFolders}
                onToggleFolder={toggleFolder}
                onSelectNote={onSelectNote}
                onFolderSelect={onFolderSelect}
                onNoteDragStart={onNoteDragStart}
                onFolderDrop={onFolderDrop}
              />
            ))}
            {roots.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                depth={0}
                selected={selectedId === note.id}
                onSelect={() => onSelectNote(note)}
                onDragStart={onNoteDragStart}
              />
            ))}
          </>
        ) : (
          filtered.map((note) => (
            <NoteRow
              key={note.id}
              note={note}
              depth={0}
              selected={selectedId === note.id}
              onSelect={() => onSelectNote(note)}
              onDragStart={onNoteDragStart}
            />
          ))
        )}
        {filtered.length === 0 && (
          <p className="text-xs text-center py-6 px-2" style={{ color: theme.textMuted }}>
            Nenhuma nota
          </p>
        )}
      </div>
    </div>
  );
}
