export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cycles: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          weekly_checkins: Json
          badges_earned: string[] | null
          final_score: number | null
          notes: string | null
          color: string | null
          category: Database["public"]["Enums"]["cycle_category"] | null
          duration: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          weekly_checkins?: Json
          badges_earned?: string[] | null
          final_score?: number | null
          notes?: string | null
          color?: string | null
          category?: Database["public"]["Enums"]["cycle_category"] | null
          duration?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          weekly_checkins?: Json
          badges_earned?: string[] | null
          final_score?: number | null
          notes?: string | null
          color?: string | null
          category?: Database["public"]["Enums"]["cycle_category"] | null
          duration?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: Database["public"]["Enums"]["goal_category"]
          goal_type: Database["public"]["Enums"]["goal_type"]
          measurement_type: Database["public"]["Enums"]["measurement_type"] | null
          target_value: number | null
          current_value: number
          unit: string | null
          cycle_id: string | null
          status: Database["public"]["Enums"]["goal_status"]
          priority: Database["public"]["Enums"]["priority_level"]
          sub_goals: Json
          milestones: Json
          weekly_targets: Json
          notes: string | null
          target_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: Database["public"]["Enums"]["goal_category"]
          goal_type?: Database["public"]["Enums"]["goal_type"]
          measurement_type?: Database["public"]["Enums"]["measurement_type"] | null
          target_value?: number | null
          current_value?: number
          unit?: string | null
          cycle_id?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          priority?: Database["public"]["Enums"]["priority_level"]
          sub_goals?: Json
          milestones?: Json
          weekly_targets?: Json
          notes?: string | null
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: Database["public"]["Enums"]["goal_category"]
          goal_type?: Database["public"]["Enums"]["goal_type"]
          measurement_type?: Database["public"]["Enums"]["measurement_type"] | null
          target_value?: number | null
          current_value?: number
          unit?: string | null
          cycle_id?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          priority?: Database["public"]["Enums"]["priority_level"]
          sub_goals?: Json
          milestones?: Json
          weekly_targets?: Json
          notes?: string | null
          target_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: Database["public"]["Enums"]["task_status"]
          priority: Database["public"]["Enums"]["task_priority"]
          important: boolean
          due_date: string | null
          estimated_hours: number | null
          actual_hours: number
          goal_id: string | null
          cycle_id: string | null
          tags: string[] | null
          assignee: string | null
          progress_percentage: number
          subtasks: Json
          comments: Json
          attachments: Json
          blocked_reason: string | null
          completion_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          important?: boolean
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number
          goal_id?: string | null
          cycle_id?: string | null
          tags?: string[] | null
          assignee?: string | null
          progress_percentage?: number
          subtasks?: Json
          comments?: Json
          attachments?: Json
          blocked_reason?: string | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          important?: boolean
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number
          goal_id?: string | null
          cycle_id?: string | null
          tags?: string[] | null
          assignee?: string | null
          progress_percentage?: number
          subtasks?: Json
          comments?: Json
          attachments?: Json
          blocked_reason?: string | null
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          }
        ]
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: Database["public"]["Enums"]["habit_category"]
          frequency_type: Database["public"]["Enums"]["habit_frequency"]
          frequency_value: number | null
          days_of_week: string[] | null
          time_of_day: string | null
          routine: Database["public"]["Enums"]["habit_routine"]
          current_streak: number
          longest_streak: number
          completion_history: Json
          cycle_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: Database["public"]["Enums"]["habit_category"]
          frequency_type?: Database["public"]["Enums"]["habit_frequency"]
          frequency_value?: number | null
          days_of_week?: string[] | null
          time_of_day?: string | null
          routine?: Database["public"]["Enums"]["habit_routine"]
          current_streak?: number
          longest_streak?: number
          completion_history?: Json
          cycle_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: Database["public"]["Enums"]["habit_category"]
          frequency_type?: Database["public"]["Enums"]["habit_frequency"]
          frequency_value?: number | null
          days_of_week?: string[] | null
          time_of_day?: string | null
          routine?: Database["public"]["Enums"]["habit_routine"]
          current_streak?: number
          longest_streak?: number
          completion_history?: Json
          cycle_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          type: Database["public"]["Enums"]["transaction_type"]
          category: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          type: Database["public"]["Enums"]["transaction_type"]
          category?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          type?: Database["public"]["Enums"]["transaction_type"]
          category?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          id: string
          user_id: string
          date: string
          mood: Database["public"]["Enums"]["mood_type"]
          energy_level: number | null
          productivity_score: number
          gratitude: string | null
          highlight: string | null
          challenge: string | null
          tomorrow_focus: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          mood: Database["public"]["Enums"]["mood_type"]
          energy_level?: number | null
          productivity_score: number
          gratitude?: string | null
          highlight?: string | null
          challenge?: string | null
          tomorrow_focus?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          mood?: Database["public"]["Enums"]["mood_type"]
          energy_level?: number | null
          productivity_score?: number
          gratitude?: string | null
          highlight?: string | null
          challenge?: string | null
          tomorrow_focus?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cycle_status: "planejamento" | "ativo" | "concluido" | "pausado"
      cycle_category: "crescimento" | "profissional" | "saude" | "relacionamentos" | "criatividade" | "financeiro" | "aprendizado" | "equilibrio"
      goal_type: "quantitativa" | "qualitativa" | "habito" | "projeto"
      goal_category: "pessoal" | "profissional" | "saude" | "financeiro" | "educacao" | "relacionamentos" | "criatividade" | "viagem"
      goal_status: "ativo" | "concluido" | "pausado" | "cancelado"
      priority_level: "baixa" | "media" | "alta" | "critica"
      task_status: "a_fazer" | "em_andamento" | "revisao" | "concluida"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      habit_category: "saude" | "produtividade" | "relacionamentos" | "crescimento" | "lazer" | "financeiro" | "outro"
      habit_frequency: "diario" | "intermitente" | "dias_especificos"
      habit_routine: "manha" | "tarde" | "noite" | "qualquer"
      transaction_type: "receita" | "despesa"
      mood_type: "muito_feliz" | "feliz" | "neutro" | "triste" | "muito_triste"
      measurement_type: "dias" | "horas" | "paginas" | "km" | "kg" | "vezes" | "sessoes" | "projetos" | "cursos" | "livros" | "artigos" | "reais" | "pontos" | "passos" | "outro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cycle_status: ["planejamento", "ativo", "concluido", "pausado"],
      cycle_category: ["crescimento", "profissional", "saude", "relacionamentos", "criatividade", "financeiro", "aprendizado", "equilibrio"],
      goal_type: ["quantitativa", "qualitativa", "habito", "projeto"],
      goal_category: ["pessoal", "profissional", "saude", "financeiro", "educacao", "relacionamentos", "criatividade", "viagem"],
      goal_status: ["ativo", "concluido", "pausado", "cancelado"],
      priority_level: ["baixa", "media", "alta", "critica"],
      task_status: ["a_fazer", "em_andamento", "revisao", "concluida"],
      task_priority: ["baixa", "media", "alta", "urgente"],
      habit_category: ["saude", "produtividade", "relacionamentos", "crescimento", "lazer", "financeiro", "outro"],
      habit_frequency: ["diario", "intermitente", "dias_especificos"],
      habit_routine: ["manha", "tarde", "noite", "qualquer"],
      transaction_type: ["receita", "despesa"],
      mood_type: ["muito_feliz", "feliz", "neutro", "triste", "muito_triste"],
      measurement_type: ["dias", "horas", "paginas", "km", "kg", "vezes", "sessoes", "projetos", "cursos", "livros", "artigos", "reais", "pontos", "passos", "outro"],
    },
  },
} as const
