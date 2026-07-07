import type { LucideIcon } from 'lucide-react';
import { Briefcase, Heart, Wallet, Star, Dumbbell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { desktopAPI } from '@/lib/desktop-api';
import { useVault } from '@/contexts/VaultContext';

export interface Vision {
  id: string;
  user_id: string;
  career_5y: string | null;
  health_5y: string | null;
  finance_5y: string | null;
  relationships_5y: string | null;
  impact_5y: string | null;
  updated_at: string;
}

export type VisionArea = 'career_5y' | 'health_5y' | 'finance_5y' | 'relationships_5y' | 'impact_5y';

export const VISION_AREAS: {
  key: VisionArea;
  label: string;
  icon: LucideIcon;
  placeholder: string;
}[] = [
  {
    key: 'career_5y',
    label: 'Carreira & Negocios',
    icon: Briefcase,
    placeholder: 'Onde voce quer estar profissionalmente em 5 anos? Que impacto quer gerar?',
  },
  {
    key: 'health_5y',
    label: 'Saude & Bem-estar',
    icon: Dumbbell,
    placeholder: 'Como quer se sentir fisicamente e mentalmente? Quais habitos quer ter?',
  },
  {
    key: 'finance_5y',
    label: 'Financas',
    icon: Wallet,
    placeholder: 'Qual sua situacao financeira ideal? Patrimonio, renda, liberdade?',
  },
  {
    key: 'relationships_5y',
    label: 'Relacionamentos',
    icon: Heart,
    placeholder: 'Como sao suas relacoes com familia, amigos, parceiro(a)?',
  },
  {
    key: 'impact_5y',
    label: 'Impacto & Legado',
    icon: Star,
    placeholder: 'Que diferenca voce quer ter feito no mundo? O que as pessoas vao lembrar de voce?',
  },
];

export function useVision() {
  const { profile } = useVault();
  const qc = useQueryClient();

  const { data: vision, isLoading } = useQuery({
    queryKey: ['vision', profile?.id],
    queryFn: async () => {
      return desktopAPI.db.vision.get() as Promise<Vision | null>;
    },
    enabled: !!profile,
  });

  const saveVision = useMutation({
    mutationFn: async (updates: Partial<Omit<Vision, 'id' | 'user_id' | 'updated_at'>>) => {
      return desktopAPI.db.vision.save(updates) as Promise<Vision>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision'] }),
  });

  return { vision, isLoading, saveVision };
}
