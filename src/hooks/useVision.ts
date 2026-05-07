import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export const VISION_AREAS: { key: VisionArea; label: string; emoji: string; placeholder: string }[] = [
  { key: 'career_5y', label: 'Carreira & Negócios', emoji: '💼', placeholder: 'Onde você quer estar profissionalmente em 5 anos? Que impacto quer gerar?' },
  { key: 'health_5y', label: 'Saúde & Bem-estar', emoji: '💪', placeholder: 'Como quer se sentir fisicamente e mentalmente? Quais hábitos quer ter?' },
  { key: 'finance_5y', label: 'Finanças', emoji: '💰', placeholder: 'Qual sua situação financeira ideal? Patrimônio, renda, liberdade?' },
  { key: 'relationships_5y', label: 'Relacionamentos', emoji: '❤️', placeholder: 'Como são suas relações com família, amigos, parceiro(a)?' },
  { key: 'impact_5y', label: 'Impacto & Legado', emoji: '🌟', placeholder: 'Que diferença você quer ter feito no mundo? O que as pessoas vão lembrar de você?' },
];

export function useVision() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: vision, isLoading } = useQuery({
    queryKey: ['vision', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('visions')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return data as Vision | null;
    },
    enabled: !!user,
  });

  const saveVision = useMutation({
    mutationFn: async (updates: Partial<Omit<Vision, 'id' | 'user_id' | 'updated_at'>>) => {
      const payload = { ...updates, user_id: user!.id, updated_at: new Date().toISOString() };
      const { data, error } = await (supabase as any)
        .from('visions')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision'] }),
  });

  return { vision, isLoading, saveVision };
}
