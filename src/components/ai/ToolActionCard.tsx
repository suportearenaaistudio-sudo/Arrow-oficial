interface ToolActionCardProps {
  preview: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ToolActionCard({ preview, onConfirm, onCancel, loading }: ToolActionCardProps) {
  return (
    <div
      className="arrow-card p-4 mb-4 border-2"
      style={{ borderColor: '#f59e0b' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#f59e0b' }}>
        Confirmação necessária
      </p>
      <p className="text-sm mb-4" style={{ color: 'var(--arrow-text-primary)' }}>{preview}</p>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
          style={{ background: '#ef4444', color: 'white' }}
        >
          {loading ? 'Executando...' : 'Confirmar'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-sm"
          style={{ background: 'var(--arrow-bg-card)', color: 'var(--arrow-text-secondary)', border: '1px solid var(--arrow-border)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
