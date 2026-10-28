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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          admin_note: string | null
          cancelled_by: string | null
          created_at: string
          decided_at: string | null
          doctor_id: number
          ends_at: string
          id: number
          patient_id: number
          patient_note: string | null
          procedure_id: number
          rejection_reason: string | null
          rescheduled_from: number | null
          source: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          cancelled_by?: string | null
          created_at?: string
          decided_at?: string | null
          doctor_id: number
          ends_at: string
          id?: never
          patient_id: number
          patient_note?: string | null
          procedure_id: number
          rejection_reason?: string | null
          rescheduled_from?: number | null
          source?: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          cancelled_by?: string | null
          created_at?: string
          decided_at?: string | null
          doctor_id?: number
          ends_at?: string
          id?: never
          patient_id?: number
          patient_note?: string | null
          procedure_id?: number
          rejection_reason?: string | null
          rescheduled_from?: number | null
          source?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          booking_window_days: number
          cancel_limit_hours: number
          clinic_name: string
          id: number
          phone: string | null
          slot_minutes: number
          time_zone: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          booking_window_days?: number
          cancel_limit_hours?: number
          clinic_name: string
          id?: number
          phone?: string | null
          slot_minutes?: number
          time_zone?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          booking_window_days?: number
          cancel_limit_hours?: number
          clinic_name?: string
          id?: number
          phone?: string | null
          slot_minutes?: number
          time_zone?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      doctor_procedures: {
        Row: {
          doctor_id: number
          procedure_id: number
        }
        Insert: {
          doctor_id: number
          procedure_id: number
        }
        Update: {
          doctor_id?: number
          procedure_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_procedures_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_procedures_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          created_at: string
          full_name: string
          id: number
          is_active: boolean
          photo_url: string | null
          sort_order: number
          specialty: string
          title: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          full_name: string
          id?: never
          is_active?: boolean
          photo_url?: string | null
          sort_order?: number
          specialty: string
          title?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: never
          is_active?: boolean
          photo_url?: string | null
          sort_order?: number
          specialty?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          created_at: string
          full_name: string
          id: number
          phone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: never
          phone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: never
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      procedures: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: number
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes: number
          id?: never
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: never
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      time_off: {
        Row: {
          created_at: string
          doctor_id: number | null
          ends_at: string
          id: number
          reason: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          doctor_id?: number | null
          ends_at: string
          id?: never
          reason?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          doctor_id?: number | null
          ends_at?: string
          id?: never
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      wa_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          id: number
          payload: Json | null
          phone: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          id?: never
          payload?: Json | null
          phone: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          id?: never
          payload?: Json | null
          phone?: string
          wa_message_id?: string | null
        }
        Relationships: []
      }
      wa_sessions: {
        Row: {
          context: Json
          last_inbound_at: string | null
          patient_id: number | null
          phone: string
          step: string
          updated_at: string
        }
        Insert: {
          context?: Json
          last_inbound_at?: string | null
          patient_id?: number | null
          phone: string
          step?: string
          updated_at?: string
        }
        Update: {
          context?: Json
          last_inbound_at?: string | null
          patient_id?: number | null
          phone?: string
          step?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wa_sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      working_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          close_time: string | null
          day_of_week: number
          is_open: boolean
          open_time: string | null
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          day_of_week: number
          is_open?: boolean
          open_time?: string | null
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          close_time?: string | null
          day_of_week?: number
          is_open?: boolean
          open_time?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_available_slots: {
        Args: { p_date: string; p_doctor_id: number; p_procedure_id: number }
        Returns: {
          slot_end: string
          slot_start: string
        }[]
      }
      reschedule_appointment: {
        Args: {
          p_appointment_id: number
          p_cancelled_by?: string
          p_new_starts_at: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
