export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cycles: {
        Row: {
          badges_earned: string[] | null
          category: Database["public"]["Enums"]["cycle_category"] | null
          color: string | null
          created_at: string
          description: string | null
          duration: number
          end_date: string
          final_score: number | null
          focus_area: string | null
          id: string
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["cycle_status"]
          title: string
          updated_at: string
          user_id: string
          vision: string | null
          weekly_checkins: Json
        }
        Insert: {
          badges_earned?: string[] | null
          category?: Database["public"]["Enums"]["cycle_category"] | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          end_date: string
          final_score?: number | null
          focus_area?: string | null
          id?: string
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["cycle_status"]
          title: string
          updated_at?: string
          user_id: string
          vision?: string | null
          weekly_checkins?: Json
        }
        Update: {
          badges_earned?: string[] | null
          category?: Database["public"]["Enums"]["cycle_category"] | null
          color?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          end_date?: string
          final_score?: number | null
          focus_area?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["cycle_status"]
          title?: string
          updated_at?: string
          user_id?: string
          vision?: string | null
          weekly_checkins?: Json
        }
        Relationships: []
      }
      daily_checkins: {
        Row: {
          challenge: string | null
          created_at: string
          date: string
          energy_level: number | null
          gratitude: string | null
          highlight: string | null
          id: string
          mood: Database["public"]["Enums"]["mood_type"]
          notes: string | null
          productivity_score: number
          tomorrow_focus: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge?: string | null
          created_at?: string
          date: string
          energy_level?: number | null
          gratitude?: string | null
          highlight?: string | null
          id?: string
          mood: Database["public"]["Enums"]["mood_type"]
          notes?: string | null
          productivity_score: number
          tomorrow_focus?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          challenge?: string | null
          created_at?: string
          date?: string
          energy_level?: number | null
          gratitude?: string | null
          highlight?: string | null
          id?: string
          mood?: Database["public"]["Enums"]["mood_type"]
          notes?: string | null
          productivity_score?: number
          tomorrow_focus?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          category: Database["public"]["Enums"]["goal_category"]
          created_at: string
          current_value: number
          cycle_id: string | null
          description: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          measurement_type:
            | Database["public"]["Enums"]["measurement_type"]
            | null
          milestones: Json
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["goal_status"]
          sub_goals: Json
          target_date: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          user_id: string
          weekly_targets: Json
        }
        Insert: {
          category?: Database["public"]["Enums"]["goal_category"]
          created_at?: string
          current_value?: number
          cycle_id?: string | null
          description?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          measurement_type?:
            | Database["public"]["Enums"]["measurement_type"]
            | null
          milestones?: Json
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["goal_status"]
          sub_goals?: Json
          target_date?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
          weekly_targets?: Json
        }
        Update: {
          category?: Database["public"]["Enums"]["goal_category"]
          created_at?: string
          current_value?: number
          cycle_id?: string | null
          description?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          measurement_type?:
            | Database["public"]["Enums"]["measurement_type"]
            | null
          milestones?: Json
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["goal_status"]
          sub_goals?: Json
          target_date?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
          weekly_targets?: Json
        }
        Relationships: [
          {
            foreignKeyName: "goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          category: Database["public"]["Enums"]["habit_category"]
          completion_history: Json
          created_at: string
          current_streak: number
          cycle_id: string | null
          days_of_week: string[] | null
          description: string | null
          frequency_type: Database["public"]["Enums"]["habit_frequency"]
          frequency_value: number | null
          id: string
          longest_streak: number
          routine: Database["public"]["Enums"]["habit_routine"]
          time_of_day: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["habit_category"]
          completion_history?: Json
          created_at?: string
          current_streak?: number
          cycle_id?: string | null
          days_of_week?: string[] | null
          description?: string | null
          frequency_type?: Database["public"]["Enums"]["habit_frequency"]
          frequency_value?: number | null
          id?: string
          longest_streak?: number
          routine?: Database["public"]["Enums"]["habit_routine"]
          time_of_day?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["habit_category"]
          completion_history?: Json
          created_at?: string
          current_streak?: number
          cycle_id?: string | null
          days_of_week?: string[] | null
          description?: string | null
          frequency_type?: Database["public"]["Enums"]["habit_frequency"]
          frequency_value?: number | null
          id?: string
          longest_streak?: number
          routine?: Database["public"]["Enums"]["habit_routine"]
          time_of_day?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          actual_hours: number
          assignee: string | null
          attachments: Json
          blocked_reason: string | null
          comments: Json
          completion_date: string | null
          created_at: string
          cycle_id: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          goal_id: string | null
          id: string
          important: boolean
          priority: Database["public"]["Enums"]["task_priority"]
          progress_percentage: number
          status: Database["public"]["Enums"]["task_status"]
          subtasks: Json
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          week_number: number | null
        }
        Insert: {
          actual_hours?: number
          assignee?: string | null
          attachments?: Json
          blocked_reason?: string | null
          comments?: Json
          completion_date?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          goal_id?: string | null
          id?: string
          important?: boolean
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_percentage?: number
          status?: Database["public"]["Enums"]["task_status"]
          subtasks?: Json
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          week_number?: number | null
        }
        Update: {
          actual_hours?: number
          assignee?: string | null
          attachments?: Json
          blocked_reason?: string | null
          comments?: Json
          completion_date?: string | null
          created_at?: string
          cycle_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          goal_id?: string | null
          id?: string
          important?: boolean
          priority?: Database["public"]["Enums"]["task_priority"]
          progress_percentage?: number
          status?: Database["public"]["Enums"]["task_status"]
          subtasks?: Json
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visions: {
        Row: {
          career_5y: string | null
          finance_5y: string | null
          health_5y: string | null
          id: string
          impact_5y: string | null
          relationships_5y: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_5y?: string | null
          finance_5y?: string | null
          health_5y?: string | null
          id?: string
          impact_5y?: string | null
          relationships_5y?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_5y?: string | null
          finance_5y?: string | null
          health_5y?: string | null
          id?: string
          impact_5y?: string | null
          relationships_5y?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weekly_scores: {
        Row: {
          created_at: string | null
          cycle_id: string
          finalized_at: string | null
          id: string
          lessons: string | null
          notes: string | null
          score: number | null
          tasks_completed: number | null
          tasks_planned: number | null
          user_id: string
          week_number: number
          what_went_wrong: string | null
        }
        Insert: {
          created_at?: string | null
          cycle_id: string
          finalized_at?: string | null
          id?: string
          lessons?: string | null
          notes?: string | null
          score?: number | null
          tasks_completed?: number | null
          tasks_planned?: number | null
          user_id: string
          week_number: number
          what_went_wrong?: string | null
        }
        Update: {
          created_at?: string | null
          cycle_id?: string
          finalized_at?: string | null
          id?: string
          lessons?: string | null
          notes?: string | null
          score?: number | null
          tasks_completed?: number | null
          tasks_planned?: number | null
          user_id?: string
          week_number?: number
          what_went_wrong?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_scores_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cycle_category:
        | "crescimento"
        | "profissional"
        | "saude"
        | "relacionamentos"
        | "criatividade"
        | "financeiro"
        | "aprendizado"
        | "equilibrio"
      cycle_status: "planejamento" | "ativo" | "concluido" | "pausado"
      goal_category:
        | "pessoal"
        | "profissional"
        | "saude"
        | "financeiro"
        | "educacao"
        | "relacionamentos"
        | "criatividade"
        | "viagem"
      goal_status: "ativo" | "concluido" | "pausado" | "cancelado"
      goal_type: "quantitativa" | "qualitativa" | "habito" | "projeto"
      habit_category:
        | "saude"
        | "produtividade"
        | "relacionamentos"
        | "crescimento"
        | "lazer"
        | "financeiro"
        | "outro"
      habit_frequency: "diario" | "intermitente" | "dias_especificos"
      habit_routine: "manha" | "tarde" | "noite" | "qualquer"
      measurement_type:
        | "dias"
        | "horas"
        | "paginas"
        | "km"
        | "kg"
        | "vezes"
        | "sessoes"
        | "projetos"
        | "cursos"
        | "livros"
        | "artigos"
        | "reais"
        | "pontos"
        | "passos"
        | "outro"
      mood_type: "muito_feliz" | "feliz" | "neutro" | "triste" | "muito_triste"
      priority_level: "baixa" | "media" | "alta" | "critica"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "a_fazer" | "em_andamento" | "revisao" | "concluida"
      transaction_type: "receita" | "despesa"
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
      cycle_category: [
        "crescimento",
        "profissional",
        "saude",
        "relacionamentos",
        "criatividade",
        "financeiro",
        "aprendizado",
        "equilibrio",
      ],
      cycle_status: ["planejamento", "ativo", "concluido", "pausado"],
      goal_category: [
        "pessoal",
        "profissional",
        "saude",
        "financeiro",
        "educacao",
        "relacionamentos",
        "criatividade",
        "viagem",
      ],
      goal_status: ["ativo", "concluido", "pausado", "cancelado"],
      goal_type: ["quantitativa", "qualitativa", "habito", "projeto"],
      habit_category: [
        "saude",
        "produtividade",
        "relacionamentos",
        "crescimento",
        "lazer",
        "financeiro",
        "outro",
      ],
      habit_frequency: ["diario", "intermitente", "dias_especificos"],
      habit_routine: ["manha", "tarde", "noite", "qualquer"],
      measurement_type: [
        "dias",
        "horas",
        "paginas",
        "km",
        "kg",
        "vezes",
        "sessoes",
        "projetos",
        "cursos",
        "livros",
        "artigos",
        "reais",
        "pontos",
        "passos",
        "outro",
      ],
      mood_type: ["muito_feliz", "feliz", "neutro", "triste", "muito_triste"],
      priority_level: ["baixa", "media", "alta", "critica"],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["a_fazer", "em_andamento", "revisao", "concluida"],
      transaction_type: ["receita", "despesa"],
    },
  },
} as const
