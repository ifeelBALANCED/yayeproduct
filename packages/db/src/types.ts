export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_requests: {
        Row: {
          ai_excerpt: string | null
          consent_contact: boolean
          consent_offer: boolean
          contact_attempted_at: string | null
          contact_preferred: string | null
          contact_value: string
          created_at: string | null
          id: string
          preferred_date: string | null
          preferred_time: string | null
          scheduled_for: string | null
          session_type: string | null
          specialist_id: string | null
          status: string | null
          topic: string | null
          user_age_band: string | null
          user_name: string
        }
        Insert: {
          ai_excerpt?: string | null
          consent_contact: boolean
          consent_offer: boolean
          contact_attempted_at?: string | null
          contact_preferred?: string | null
          contact_value: string
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          scheduled_for?: string | null
          session_type?: string | null
          specialist_id?: string | null
          status?: string | null
          topic?: string | null
          user_age_band?: string | null
          user_name: string
        }
        Update: {
          ai_excerpt?: string | null
          consent_contact?: boolean
          consent_offer?: boolean
          contact_attempted_at?: string | null
          contact_preferred?: string | null
          contact_value?: string
          created_at?: string | null
          id?: string
          preferred_date?: string | null
          preferred_time?: string | null
          scheduled_for?: string | null
          session_type?: string | null
          specialist_id?: string | null
          status?: string | null
          topic?: string | null
          user_age_band?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_log: {
        Row: {
          consent_type: string
          evidence: Json | null
          granted: boolean
          granted_at: string | null
          id: string
          scope: string
          user_id: string | null
          withdrawn_at: string | null
        }
        Insert: {
          consent_type: string
          evidence?: Json | null
          granted: boolean
          granted_at?: string | null
          id?: string
          scope: string
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          consent_type?: string
          evidence?: Json | null
          granted?: boolean
          granted_at?: string | null
          id?: string
          scope?: string
          user_id?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_events: {
        Row: {
          created_at: string | null
          detection_method: string | null
          hotlines_shown: string[] | null
          id: string
          jurisdiction: string
          review_at: string | null
          review_by: string | null
          review_notes: string | null
          session_id: string | null
          severity: string
          trigger_message_id: string | null
          user_action: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detection_method?: string | null
          hotlines_shown?: string[] | null
          id?: string
          jurisdiction: string
          review_at?: string | null
          review_by?: string | null
          review_notes?: string | null
          session_id?: string | null
          severity: string
          trigger_message_id?: string | null
          user_action?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detection_method?: string | null
          hotlines_shown?: string[] | null
          id?: string
          jurisdiction?: string
          review_at?: string | null
          review_by?: string | null
          review_notes?: string | null
          session_id?: string | null
          severity?: string
          trigger_message_id?: string | null
          user_action?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crisis_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crisis_events_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crisis_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_feedback: {
        Row: {
          created_at: string | null
          id: string
          result: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          result: string
        }
        Update: {
          created_at?: string | null
          id?: string
          result?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          flagged_for_review: boolean | null
          fm_detected: number | null
          id: string
          mode: number | null
          principle_applied: string | null
          prompt_version: string | null
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          flagged_for_review?: boolean | null
          fm_detected?: number | null
          id?: string
          mode?: number | null
          principle_applied?: string | null
          prompt_version?: string | null
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          flagged_for_review?: boolean | null
          fm_detected?: number | null
          id?: string
          mode?: number | null
          principle_applied?: string | null
          prompt_version?: string | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          accepted_slot: string | null
          age_band: string | null
          consent_log_id: string | null
          created_at: string | null
          id: string
          jurisdiction: string | null
          modes_sequence: number[] | null
          proposed_slots: Json | null
          session_id: string | null
          status: string
          summary: string | null
          summary_approved_at: string | null
          summary_approved_by_teen: boolean | null
          theme: string | null
          therapist_id: string | null
          urgency: string
          user_id: string | null
        }
        Insert: {
          accepted_slot?: string | null
          age_band?: string | null
          consent_log_id?: string | null
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          modes_sequence?: number[] | null
          proposed_slots?: Json | null
          session_id?: string | null
          status?: string
          summary?: string | null
          summary_approved_at?: string | null
          summary_approved_by_teen?: boolean | null
          theme?: string | null
          therapist_id?: string | null
          urgency?: string
          user_id?: string | null
        }
        Update: {
          accepted_slot?: string | null
          age_band?: string | null
          consent_log_id?: string | null
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          modes_sequence?: number[] | null
          proposed_slots?: Json | null
          session_id?: string | null
          status?: string
          summary?: string | null
          summary_approved_at?: string | null
          summary_approved_by_teen?: boolean | null
          theme?: string | null
          therapist_id?: string | null
          urgency?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "therapists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          end_reason: string | null
          ended_at: string | null
          fm_dominant: number | null
          graduation_completed: boolean | null
          id: string
          modes_sequence: number[] | null
          started_at: string | null
          theme: string | null
          user_id: string | null
        }
        Insert: {
          end_reason?: string | null
          ended_at?: string | null
          fm_dominant?: number | null
          graduation_completed?: boolean | null
          id?: string
          modes_sequence?: number[] | null
          started_at?: string | null
          theme?: string | null
          user_id?: string | null
        }
        Update: {
          end_reason?: string | null
          ended_at?: string | null
          fm_dominant?: number | null
          graduation_completed?: boolean | null
          id?: string
          modes_sequence?: number[] | null
          started_at?: string | null
          theme?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      specialists: {
        Row: {
          bio_paragraphs: string[] | null
          cal_com_url: string | null
          certifications: string | null
          created_at: string | null
          discovery_duration_min: number | null
          discovery_price_text: string | null
          education: string | null
          email: string | null
          email_disclaimer: string | null
          featured: boolean | null
          full_duration_min: number | null
          full_name: string
          full_price_text: string | null
          hero_quote: string | null
          id: string
          languages: string[] | null
          methodology_connection: string | null
          offers_discovery: boolean | null
          offers_full: boolean | null
          offers_thematic: boolean | null
          photo_alt: string | null
          photo_url: string | null
          slug: string
          specializations: string[] | null
          status: string | null
          subtitle: string | null
          telegram_disclaimer: string | null
          telegram_username: string | null
          thematic_duration_min: number | null
          thematic_price_text: string | null
          title: string
          updated_at: string | null
          whereby_room_url: string | null
          works_with: string[] | null
        }
        Insert: {
          bio_paragraphs?: string[] | null
          cal_com_url?: string | null
          certifications?: string | null
          created_at?: string | null
          discovery_duration_min?: number | null
          discovery_price_text?: string | null
          education?: string | null
          email?: string | null
          email_disclaimer?: string | null
          featured?: boolean | null
          full_duration_min?: number | null
          full_name: string
          full_price_text?: string | null
          hero_quote?: string | null
          id?: string
          languages?: string[] | null
          methodology_connection?: string | null
          offers_discovery?: boolean | null
          offers_full?: boolean | null
          offers_thematic?: boolean | null
          photo_alt?: string | null
          photo_url?: string | null
          slug: string
          specializations?: string[] | null
          status?: string | null
          subtitle?: string | null
          telegram_disclaimer?: string | null
          telegram_username?: string | null
          thematic_duration_min?: number | null
          thematic_price_text?: string | null
          title: string
          updated_at?: string | null
          whereby_room_url?: string | null
          works_with?: string[] | null
        }
        Update: {
          bio_paragraphs?: string[] | null
          cal_com_url?: string | null
          certifications?: string | null
          created_at?: string | null
          discovery_duration_min?: number | null
          discovery_price_text?: string | null
          education?: string | null
          email?: string | null
          email_disclaimer?: string | null
          featured?: boolean | null
          full_duration_min?: number | null
          full_name?: string
          full_price_text?: string | null
          hero_quote?: string | null
          id?: string
          languages?: string[] | null
          methodology_connection?: string | null
          offers_discovery?: boolean | null
          offers_full?: boolean | null
          offers_thematic?: boolean | null
          photo_alt?: string | null
          photo_url?: string | null
          slug?: string
          specializations?: string[] | null
          status?: string | null
          subtitle?: string | null
          telegram_disclaimer?: string | null
          telegram_username?: string | null
          thematic_duration_min?: number | null
          thematic_price_text?: string | null
          title?: string
          updated_at?: string | null
          whereby_room_url?: string | null
          works_with?: string[] | null
        }
        Relationships: []
      }
      therapists: {
        Row: {
          active: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          free_first_session: boolean | null
          full_name: string
          id: string
          jurisdictions: string[]
          languages: string[]
          license_authority: string
          license_number: string
          license_verified_at: string | null
          license_verified_by: string | null
          modalities: string[] | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          free_first_session?: boolean | null
          full_name: string
          id?: string
          jurisdictions: string[]
          languages: string[]
          license_authority: string
          license_number: string
          license_verified_at?: string | null
          license_verified_by?: string | null
          modalities?: string[] | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          free_first_session?: boolean | null
          full_name?: string
          id?: string
          jurisdictions?: string[]
          languages?: string[]
          license_authority?: string
          license_number?: string
          license_verified_at?: string | null
          license_verified_by?: string | null
          modalities?: string[] | null
        }
        Relationships: []
      }
      users: {
        Row: {
          age_band: string
          created_at: string | null
          deleted_at: string | null
          id: string
          jurisdiction: string
          last_seen_at: string | null
          locale: string
          parental_consent_method: string | null
          parental_consent_status: string | null
        }
        Insert: {
          age_band: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          jurisdiction?: string
          last_seen_at?: string | null
          locale?: string
          parental_consent_method?: string | null
          parental_consent_status?: string | null
        }
        Update: {
          age_band?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          jurisdiction?: string
          last_seen_at?: string | null
          locale?: string
          parental_consent_method?: string | null
          parental_consent_status?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

