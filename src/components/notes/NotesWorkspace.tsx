import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Edit3, Plus, FolderPlus, Search, BookOpen, Share2 } from 'lucide-react';
import { usePageContextMenu } from '@/contexts/DesktopContextMenuContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotes, useNoteBacklinks } from '@/hooks/useNotes';
import { useNoteNavigation } from '@/hooks/useNoteNavigation';
import { useNoteNavigationHistory } from '@/hooks/useNoteNavigationHistory';
import NotesImmersiveShell from '@/components/notes/NotesImmersiveShell';
import NoteFileExplorer from '@/components/notes/NoteFileExplorer';
import NoteEditorPane from '@/components/notes/NoteEditorPane';
import NoteBacklinksPanel from '@/components/notes/NoteBacklinksPanel';
import NoteGraphView from '@/components/notes/NoteGraphView';
import NoteToolbar, { type SaveStatus } from '@/components/notes/NoteToolbar';
import NoteTabBar from '@/components/notes/NoteTabBar';
import NoteNavBar from '@/components/notes/NoteNavBar';
import NoteStatusBar, { noteStats } from '@/components/notes/NoteStatusBar';
import NoteQuickSwitcher from '@/components/notes/NoteQuickSwitcher';
import type { Note } from '@/types/arrow';

const REBUILD_KEY = 'arrow-notes-index-rebuilt';
const TABS_KEY = 'arrow-notes-open-tabs';

function loadTabs(): string[] {
  try {
    const raw = sessionStorage.getItem(TABS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTabs(tabs: string[]) {
  sessionStorage.setItem(TABS_KEY, JSON.stringify(tabs));
}

export default function NotesWorkspace() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId: routeNoteId } = useParams<{ noteId?: string }>();
  const isGraphRoute = location.pathname.endsWith('/graph');

  const { notes, isLoading, createNote, updateNote, deleteNote, rebuildIndex } = useNotes();
  const { followWikilink } = useNoteNavigation();
  const { push: pushHistory, goBack, goForward, canGoBack, canGoForward } = useNoteNavigationHistory();

  const [search, setSearch] = useState('');
  const [tagFilter] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [pendingFolder, setPendingFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [quickOpen, setQuickOpen] = useState(false);
  const [openTabs, setOpenTabs] = useState<string[]>(loadTabs);
  const [readingMode, setReadingMode] = useState(false);
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [focusTitle, setFocusTitle] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  const { data: backlinksData } = useNoteBacklinks(selectedNote?.id ?? null);
  const backlinkCount = backlinksData?.backlinks?.length ?? 0;
  const stats = noteStats(editContent, editTitle);

  useEffect(() => {
    if (!localStorage.getItem(REBUILD_KEY)) {
      rebuildIndex.mutate(undefined, {
        onSuccess: () => localStorage.setItem(REBUILD_KEY, '1'),
      });
    }
  }, [rebuildIndex]);

  useEffect(() => {
    saveTabs(openTabs);
  }, [openTabs]);

  useEffect(() => {
    if (routeNoteId && notes.length > 0) {
      const found = notes.find((n) => n.id === routeNoteId);
      if (found && found.id !== selectedNote?.id) {
        setSelectedNote(found);
        setEditTitle(found.title);
        setEditContent(found.content || '');
        dirtyRef.current = false;
        setOpenTabs((prev) => (prev.includes(found.id) ? prev : [...prev, found.id]));
        pushHistory(found.id);
      }
    }
  }, [routeNoteId, notes, selectedNote?.id, pushHistory]);

  const persistNote = useCallback(async () => {
    if (!selectedNote || !dirtyRef.current) return;
    setSaveStatus('saving');
    try {
      await updateNote.mutateAsync({
        id: selectedNote.id,
        title: editTitle,
        content: editContent,
        folder: selectedNote.folder,
      });
      dirtyRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [selectedNote, editTitle, editContent, updateNote]);

  useEffect(() => {
    if (!selectedNote || !dirtyRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistNote(), 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [editTitle, editContent, selectedNote, persistNote]);

  useEffect(() => {
    const onSave = () => persistNote();
    window.addEventListener('arrow-notes-save', onSave);
    return () => window.removeEventListener('arrow-notes-save', onSave);
  }, [persistNote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setQuickOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setReadingMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelectNote = useCallback((note: Note, options?: { focusTitle?: boolean }) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
    dirtyRef.current = false;
    setReadingMode(false);
    setOpenTabs((prev) => (prev.includes(note.id) ? prev : [...prev, note.id]));
    pushHistory(note.id);
    if (options?.focusTitle) setFocusTitle(true);
    navigate(`/notes/${note.id}`);
  }, [navigate, pushHistory]);

  function handleInstantNewNote() {
    const folder = pendingFolder || selectedFolder || undefined;
    createNote.mutate(
      { title: 'Sem título', content: '', tags: [], folder },
      {
        onSuccess: (note) => {
          setPendingFolder(null);
          handleSelectNote(note, { focusTitle: true });
        },
      },
    );
  }

  function handleNewFolder() {
    const name = window.prompt('Nome da pasta:');
    if (name?.trim()) {
      setPendingFolder(name.trim());
      setSelectedFolder(name.trim());
    }
  }

  usePageContextMenu(
    () => [
      { id: 'new-note', label: 'Nova nota', icon: Plus, onClick: handleInstantNewNote },
      { id: 'new-folder', label: 'Nova pasta', icon: FolderPlus, onClick: handleNewFolder },
      { id: 'quick-open', label: 'Busca rápida', icon: Search, onClick: () => setQuickOpen(true) },
      {
        id: 'reading-mode',
        label: readingMode ? 'Sair do modo leitura' : 'Modo leitura',
        icon: BookOpen,
        onClick: () => setReadingMode((v) => !v),
      },
      {
        id: 'graph-view',
        label: isGraphRoute ? 'Voltar ao editor' : 'Grafo de notas',
        icon: Share2,
        onClick: () => navigate(isGraphRoute ? '/notes' : '/notes/graph'),
      },
    ],
    [readingMode, isGraphRoute],
  );

  function handleCloseTab(id: string) {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id);
      if (id === selectedNote?.id) {
        const fallback = next[next.length - 1];
        if (fallback) {
          const note = notes.find((n) => n.id === fallback);
          if (note) handleSelectNote(note);
        } else {
          setSelectedNote(null);
          navigate('/notes');
        }
      }
      return next;
    });
  }

  function handleDelete() {
    if (!selectedNote) return;
    const closingId = selectedNote.id;
    deleteNote.mutate(closingId, {
      onSuccess: () => {
        handleCloseTab(closingId);
        setSelectedNote(null);
        navigate('/notes');
      },
    });
  }

  function handleDragStart(e: React.DragEvent, note: Note) {
    e.dataTransfer.setData('note/id', note.id);
  }

  function handleFolderDrop(e: React.DragEvent, folder: string | null) {
    e.preventDefault();
    const id = e.dataTransfer.getData('note/id');
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    updateNote.mutate({ id: note.id, folder: folder || '' });
  }

  function handleNavBack() {
    const id = goBack();
    if (id) {
      const note = notes.find((n) => n.id === id);
      if (note) handleSelectNote(note);
    }
  }

  function handleNavForward() {
    const id = goForward();
    if (id) {
      const note = notes.find((n) => n.id === id);
      if (note) handleSelectNote(note);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="arrow-spinner" /></div>;
  }

  return (
    <NotesImmersiveShell>
      <NoteToolbar
        mode={isGraphRoute ? 'graph' : 'editor'}
        onNewNote={handleInstantNewNote}
        onOpenGraph={() => navigate('/notes/graph')}
        onOpenEditor={() => navigate(selectedNote ? `/notes/${selectedNote.id}` : '/notes')}
        onQuickSwitcher={() => setQuickOpen(true)}
      />

      {!isGraphRoute && (
        <NoteTabBar
          tabs={openTabs}
          activeId={selectedNote?.id ?? null}
          notes={notes}
          onSelect={(id) => {
            const note = notes.find((n) => n.id === id);
            if (note) handleSelectNote(note);
          }}
          onClose={handleCloseTab}
          onNewTab={handleInstantNewNote}
        />
      )}

      {!isGraphRoute && selectedNote && (
        <NoteNavBar
          folder={selectedNote.folder || null}
          title={editTitle}
          readingMode={readingMode}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onGoBack={handleNavBack}
          onGoForward={handleNavForward}
          onFolderClick={() => setSelectedFolder(selectedNote.folder || null)}
          onToggleReading={() => setReadingMode((v) => !v)}
          onDelete={handleDelete}
          onRebuildIndex={() => rebuildIndex.mutate()}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {!isGraphRoute && (
          <NoteFileExplorer
            notes={notes}
            selectedId={selectedNote?.id ?? null}
            search={search}
            onSearchChange={setSearch}
            onSelectNote={handleSelectNote}
            selectedFolder={selectedFolder}
            onFolderSelect={setSelectedFolder}
            onNoteDragStart={handleDragStart}
            onFolderDrop={handleFolderDrop}
            onNewNote={handleInstantNewNote}
            onNewFolder={handleNewFolder}
            collapsed={explorerCollapsed}
            onToggleCollapse={() => setExplorerCollapsed((v) => !v)}
          />
        )}

        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          {isGraphRoute ? (
            <div className="flex-1 min-h-0 p-3">
              <NoteGraphView
                focusNoteId={selectedNote?.id}
                tagFilter={tagFilter || null}
                onNodeClick={(id) => {
                  const note = notes.find((n) => n.id === id);
                  if (note) handleSelectNote(note);
                }}
              />
            </div>
          ) : selectedNote ? (
            <NoteEditorPane
              title={editTitle}
              content={editContent}
              readingMode={readingMode}
              notes={notes}
              focusTitle={focusTitle}
              onTitleChange={(v) => { setEditTitle(v); dirtyRef.current = true; }}
              onContentChange={(v) => { setEditContent(v); dirtyRef.current = true; }}
              onWikilinkClick={(title) => followWikilink(title, selectedNote.folder)}
              onTitleFocused={() => setFocusTitle(false)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Edit3 className="w-10 h-10 mb-3" style={{ color: theme.textMuted }} />
              <p style={{ color: theme.textMuted }}>Selecione ou crie uma nota</p>
              <button
                type="button"
                onClick={handleInstantNewNote}
                className="mt-3 arrow-btn-primary text-xs py-1.5 px-4"
                style={{ color: theme.accentForeground }}
              >
                Nova nota
              </button>
            </div>
          )}
        </div>

        {!isGraphRoute && (
          <NoteBacklinksPanel
            noteId={selectedNote?.id ?? null}
            open={backlinksOpen}
            onClose={() => setBacklinksOpen(false)}
            onOpenNote={(id) => {
              const note = notes.find((n) => n.id === id);
              if (note) handleSelectNote(note);
            }}
            onFollowTitle={(title) => followWikilink(title, selectedNote?.folder)}
          />
        )}
      </div>

      {!isGraphRoute && selectedNote && (
        <NoteStatusBar
          backlinkCount={backlinkCount}
          wordCount={stats.words}
          charCount={stats.chars}
          saveStatus={saveStatus}
          onBacklinksClick={() => setBacklinksOpen((v) => !v)}
        />
      )}

      <NoteQuickSwitcher
        open={quickOpen}
        onOpenChange={setQuickOpen}
        onSelect={(id) => {
          const note = notes.find((n) => n.id === id);
          if (note) handleSelectNote(note);
        }}
      />
    </NotesImmersiveShell>
  );
}
