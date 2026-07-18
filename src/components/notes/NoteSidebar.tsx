import { useMemo } from 'react';
import { Folder, FileText } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { Note } from '@/types/arrow';

interface NoteSidebarProps {
  notes: Note[];
  selectedId: string | null;
  search: string;
  tagFilter: string;
  onSearchChange: (v: string) => void;
  onTagFilterChange: (v: string) => void;
  onSelectNote: (note: Note) => void;
  selectedFolder: string | null;
  onFolderSelect: (folder: string | null) => void;
  onNoteDragStart?: (e: React.DragEvent, note: Note) => void;
  onFolderDrop?: (e: React.DragEvent, folder: string | null) => void;
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
    if (!folder) {
      roots.push(note);
    } else {
      ensureFolder(folder).notes.push(note);
    }
  }

  const topFolders = [...folderMap.values()].filter((f) => !f.path.includes('/'));
  return { roots, folders: topFolders.sort((a, b) => a.name.localeCompare(b.name)) };
}

function FolderSection({
  node,
  depth,
  selectedId,
  selectedFolder,
  onSelectNote,
  onFolderSelect,
  onNoteDragStart,
  onFolderDrop,
}: {
  node: FolderNode;
  depth: number;
  selectedId: string | null;
  selectedFolder: string | null;
  onSelectNote: (n: Note) => void;
  onFolderSelect: (f: string | null) => void;
  onNoteDragStart?: (e: React.DragEvent, note: Note) => void;
  onFolderDrop?: (e: React.DragEvent, folder: string | null) => void;
}) {
  const { theme } = useTheme();
  const isSelected = selectedFolder === node.path;

  return (
    <div>
      <button
        type="button"
        onClick={() => onFolderSelect(isSelected ? null : node.path)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onFolderDrop?.(e, node.path)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left text-xs"
        style={{
          paddingLeft: 8 + depth * 12,
          background: isSelected ? theme.accentLight : 'transparent',
          color: theme.textPrimary,
        }}
      >
        <Folder className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accent }} />
        <span className="truncate font-medium">{node.name}</span>
        <span className="ml-auto text-[10px]" style={{ color: theme.textMuted }}>
          {node.notes.length}
        </span>
      </button>
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
          onSelectNote={onSelectNote}
          onFolderSelect={onFolderSelect}
          onNoteDragStart={onNoteDragStart}
          onFolderDrop={onFolderDrop}
        />
      ))}
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
      className="w-full text-left px-2 py-2 rounded-xl transition-colors"
      style={{
        paddingLeft: 8 + depth * 12,
        background: selected
          ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
          : 'transparent',
      }}
    >
      <div className="flex items-start gap-2">
        <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: theme.accent }} />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: theme.textPrimary }}>
            {note.title}
          </p>
          <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>
            {(note.content || '').slice(0, 60) || 'Sem conteúdo'}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function NoteSidebar({
  notes,
  selectedId,
  search,
  tagFilter,
  onSearchChange,
  onTagFilterChange,
  onSelectNote,
  selectedFolder,
  onFolderSelect,
  onNoteDragStart,
  onFolderDrop,
}: NoteSidebarProps) {
  const { theme } = useTheme();
  const allTags = [...new Set(notes.flatMap((n) => n.tags || []))];

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (tagFilter && !(n.tags || []).includes(tagFilter)) return false;
      if (selectedFolder && n.folder !== selectedFolder) return false;
      return true;
    });
  }, [notes, search, tagFilter, selectedFolder]);

  const { roots, folders } = useMemo(() => buildTree(filtered), [filtered]);
  const showTree = !search && !tagFilter;

  return (
    <div className="w-72 flex-shrink-0 flex flex-col h-full border-r pr-3" style={{ borderColor: theme.border }}>
      <input
        type="text"
        placeholder="Buscar notas..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border text-sm mb-2"
        style={{ borderColor: theme.border, background: 'var(--arrow-bg-elevated)' }}
      />
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagFilterChange(tagFilter === tag ? '' : tag)}
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{
                background: tagFilter === tag ? theme.accent : theme.accentLight,
                color: tagFilter === tag ? theme.accentForeground : theme.accent,
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div
        className="flex-1 overflow-y-auto space-y-0.5"
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
          <p className="text-xs text-center py-6" style={{ color: theme.textMuted }}>
            Nenhuma nota encontrada
          </p>
        )}
      </div>
    </div>
  );
}
