import { FilePlus2, FileText, Trash2 } from 'lucide-react';
import { useWorkouts } from '@/hooks/useWorkouts';
import { desktopAPI, isDesktop } from '@/lib/desktop-api';

export default function WorkoutHealthPanel({ programId }: { programId?: string | null }) {
  const { healthDocuments, importHealthDocument, deleteHealthDocument } = useWorkouts();
  const documents = healthDocuments.filter((document) => !programId || document.program_id === programId);
  async function addDocument() {
    const sourcePath = isDesktop() ? await desktopAPI.db.workouts.healthDocuments.pick() : null;
    if (sourcePath) importHealthDocument.mutate({ sourcePath, data: { program_id: programId ?? undefined, tags: [] } });
  }
  return <div className="arrow-card p-5"><div className="flex items-center justify-between mb-3"><div><h3 className="font-semibold text-sm">Saúde e documentos</h3><p className="text-xs text-gray-500 mt-0.5">Exames, fichas e orientações ficam no vault.</p></div><button onClick={() => void addDocument()} className="arrow-btn-secondary text-xs flex gap-1"><FilePlus2 className="w-3.5 h-3.5" /> Anexar</button></div>
    {documents.length ? <div className="space-y-2">{documents.map((document) => <div key={document.id} className="flex gap-2 items-center text-sm"><FileText className="w-4 h-4 text-orange-500" /><span className="flex-1 truncate">{document.name}</span><button onClick={() => deleteHealthDocument.mutate(document.id)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>)}</div> : <p className="text-xs text-gray-500">Nenhum documento anexado.</p>}
  </div>;
}
