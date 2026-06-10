// Типи генеруються з Supabase схеми.
// Формат відповідає виводу `supabase gen types typescript` (CLI v2.x).
// Оновлювати: supabase gen types typescript --local > packages/db/src/types.ts
// Дрейф типів перевіряється скриптом scripts/check-db-types.sh (S2 gate).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          age_band: string;
          locale: string;
          jurisdiction: string;
          parental_consent_status: string | null;
          parental_consent_method: string | null;
          created_at: string | null;
          last_seen_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          age_band: string;
          locale?: string;
          jurisdiction?: string;
          parental_consent_status?: string | null;
          parental_consent_method?: string | null;
          created_at?: string | null;
          last_seen_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          age_band?: string;
          locale?: string;
          jurisdiction?: string;
          parental_consent_status?: string | null;
          parental_consent_method?: string | null;
          created_at?: string | null;
          last_seen_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string | null;
          theme: string | null;
          started_at: string | null;
          ended_at: string | null;
          end_reason: string | null;
          modes_sequence: number[] | null;
          fm_dominant: number | null;
          graduation_completed: boolean | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          theme?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          end_reason?: string | null;
          modes_sequence?: number[] | null;
          fm_dominant?: number | null;
          graduation_completed?: boolean | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          theme?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          end_reason?: string | null;
          modes_sequence?: number[] | null;
          fm_dominant?: number | null;
          graduation_completed?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          session_id: string | null;
          role: string;
          content: string;
          mode: number | null;
          fm_detected: number | null;
          principle_applied: string | null;
          created_at: string | null;
          flagged_for_review: boolean | null;
          // Додано у 000002, default 'v1.3'; default змінено на 'v1.4' у 000003
          prompt_version: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          role: string;
          content: string;
          mode?: number | null;
          fm_detected?: number | null;
          principle_applied?: string | null;
          created_at?: string | null;
          flagged_for_review?: boolean | null;
          prompt_version?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          role?: string;
          content?: string;
          mode?: number | null;
          fm_detected?: number | null;
          principle_applied?: string | null;
          created_at?: string | null;
          flagged_for_review?: boolean | null;
          prompt_version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      crisis_events: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          trigger_message_id: string | null;
          severity: string;
          detection_method: string | null;
          jurisdiction: string;
          hotlines_shown: string[] | null;
          user_action: string | null;
          // Перейменовано у 000002: clinical_review_at → review_at
          review_at: string | null;
          // Перейменовано у 000002: clinical_review_by → review_by
          review_by: string | null;
          // Перейменовано у 000002: clinical_notes → review_notes
          review_notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          trigger_message_id?: string | null;
          severity: string;
          detection_method?: string | null;
          jurisdiction: string;
          hotlines_shown?: string[] | null;
          user_action?: string | null;
          review_at?: string | null;
          review_by?: string | null;
          review_notes?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          trigger_message_id?: string | null;
          severity?: string;
          detection_method?: string | null;
          jurisdiction?: string;
          hotlines_shown?: string[] | null;
          user_action?: string | null;
          review_at?: string | null;
          review_by?: string | null;
          review_notes?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'crisis_events_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'crisis_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'crisis_events_trigger_message_id_fkey';
            columns: ['trigger_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      therapists: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          license_authority: string;
          license_number: string;
          license_verified_at: string | null;
          license_verified_by: string | null;
          jurisdictions: string[];
          languages: string[];
          modalities: string[] | null;
          city: string | null;
          country: string | null;
          free_first_session: boolean | null;
          active: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          license_authority: string;
          license_number: string;
          license_verified_at?: string | null;
          license_verified_by?: string | null;
          jurisdictions: string[];
          languages: string[];
          modalities?: string[] | null;
          city?: string | null;
          country?: string | null;
          free_first_session?: boolean | null;
          active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          license_authority?: string;
          license_number?: string;
          license_verified_at?: string | null;
          license_verified_by?: string | null;
          jurisdictions?: string[];
          languages?: string[];
          modalities?: string[] | null;
          city?: string | null;
          country?: string | null;
          free_first_session?: boolean | null;
          active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string | null;
          therapist_id: string | null;
          status: string;
          urgency: string;
          theme: string | null;
          age_band: string | null;
          jurisdiction: string | null;
          modes_sequence: number[] | null;
          summary: string | null;
          summary_approved_by_teen: boolean | null;
          summary_approved_at: string | null;
          consent_log_id: string | null;
          proposed_slots: Json | null;
          accepted_slot: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          therapist_id?: string | null;
          status?: string;
          urgency?: string;
          theme?: string | null;
          age_band?: string | null;
          jurisdiction?: string | null;
          modes_sequence?: number[] | null;
          summary?: string | null;
          summary_approved_by_teen?: boolean | null;
          summary_approved_at?: string | null;
          consent_log_id?: string | null;
          proposed_slots?: Json | null;
          accepted_slot?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          user_id?: string | null;
          therapist_id?: string | null;
          status?: string;
          urgency?: string;
          theme?: string | null;
          age_band?: string | null;
          jurisdiction?: string | null;
          modes_sequence?: number[] | null;
          summary?: string | null;
          summary_approved_by_teen?: boolean | null;
          summary_approved_at?: string | null;
          consent_log_id?: string | null;
          proposed_slots?: Json | null;
          accepted_slot?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'referrals_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referrals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'referrals_therapist_id_fkey';
            columns: ['therapist_id'];
            isOneToOne: false;
            referencedRelation: 'therapists';
            referencedColumns: ['id'];
          },
        ];
      };
      consent_log: {
        Row: {
          id: string;
          user_id: string | null;
          consent_type: string;
          scope: string;
          granted: boolean;
          granted_at: string | null;
          withdrawn_at: string | null;
          evidence: Json | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          consent_type: string;
          scope: string;
          granted: boolean;
          granted_at?: string | null;
          withdrawn_at?: string | null;
          evidence?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          consent_type?: string;
          scope?: string;
          granted?: boolean;
          granted_at?: string | null;
          withdrawn_at?: string | null;
          evidence?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'consent_log_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      specialists: {
        Row: {
          id: string;
          slug: string;
          full_name: string;
          title: string;
          subtitle: string | null;
          photo_url: string | null;
          photo_alt: string | null;
          hero_quote: string | null;
          bio_paragraphs: string[] | null;
          methodology_connection: string | null;
          specializations: string[] | null;
          works_with: string[] | null;
          education: string | null;
          certifications: string | null;
          languages: string[] | null;
          offers_discovery: boolean | null;
          discovery_duration_min: number | null;
          discovery_price_text: string | null;
          offers_thematic: boolean | null;
          thematic_duration_min: number | null;
          thematic_price_text: string | null;
          offers_full: boolean | null;
          full_duration_min: number | null;
          full_price_text: string | null;
          telegram_username: string | null;
          telegram_disclaimer: string | null;
          email: string | null;
          email_disclaimer: string | null;
          cal_com_url: string | null;
          whereby_room_url: string | null;
          status: string | null;
          featured: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          full_name: string;
          title: string;
          subtitle?: string | null;
          photo_url?: string | null;
          photo_alt?: string | null;
          hero_quote?: string | null;
          bio_paragraphs?: string[] | null;
          methodology_connection?: string | null;
          specializations?: string[] | null;
          works_with?: string[] | null;
          education?: string | null;
          certifications?: string | null;
          languages?: string[] | null;
          offers_discovery?: boolean | null;
          discovery_duration_min?: number | null;
          discovery_price_text?: string | null;
          offers_thematic?: boolean | null;
          thematic_duration_min?: number | null;
          thematic_price_text?: string | null;
          offers_full?: boolean | null;
          full_duration_min?: number | null;
          full_price_text?: string | null;
          telegram_username?: string | null;
          telegram_disclaimer?: string | null;
          email?: string | null;
          email_disclaimer?: string | null;
          cal_com_url?: string | null;
          whereby_room_url?: string | null;
          status?: string | null;
          featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          full_name?: string;
          title?: string;
          subtitle?: string | null;
          photo_url?: string | null;
          photo_alt?: string | null;
          hero_quote?: string | null;
          bio_paragraphs?: string[] | null;
          methodology_connection?: string | null;
          specializations?: string[] | null;
          works_with?: string[] | null;
          education?: string | null;
          certifications?: string | null;
          languages?: string[] | null;
          offers_discovery?: boolean | null;
          discovery_duration_min?: number | null;
          discovery_price_text?: string | null;
          offers_thematic?: boolean | null;
          thematic_duration_min?: number | null;
          thematic_price_text?: string | null;
          offers_full?: boolean | null;
          full_duration_min?: number | null;
          full_price_text?: string | null;
          telegram_username?: string | null;
          telegram_disclaimer?: string | null;
          email?: string | null;
          email_disclaimer?: string | null;
          cal_com_url?: string | null;
          whereby_room_url?: string | null;
          status?: string | null;
          featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      booking_requests: {
        Row: {
          id: string;
          specialist_id: string | null;
          session_type: string | null;
          user_name: string;
          contact_preferred: string | null;
          contact_value: string;
          user_age_band: string | null;
          topic: string | null;
          ai_excerpt: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          consent_offer: boolean;
          consent_contact: boolean;
          status: string | null;
          contact_attempted_at: string | null;
          scheduled_for: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          specialist_id?: string | null;
          session_type?: string | null;
          user_name: string;
          contact_preferred?: string | null;
          contact_value: string;
          user_age_band?: string | null;
          topic?: string | null;
          ai_excerpt?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          consent_offer: boolean;
          consent_contact: boolean;
          status?: string | null;
          contact_attempted_at?: string | null;
          scheduled_for?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          specialist_id?: string | null;
          session_type?: string | null;
          user_name?: string;
          contact_preferred?: string | null;
          contact_value?: string;
          user_age_band?: string | null;
          topic?: string | null;
          ai_excerpt?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          consent_offer?: boolean;
          consent_contact?: boolean;
          status?: string | null;
          contact_attempted_at?: string | null;
          scheduled_for?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'booking_requests_specialist_id_fkey';
            columns: ['specialist_id'];
            isOneToOne: false;
            referencedRelation: 'specialists';
            referencedColumns: ['id'];
          },
        ];
      };
      exercise_feedback: {
        Row: {
          id: string;
          result: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          result: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          result?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ============================================================
// Backward-compatible type aliases — зберігають контракт index.ts.
// Споживачі пакету @ya-ye/db ніколи не імпортували прямо з apps/*,
// тому аліаси визначаються тут і ре-експортуються через index.ts.
// ============================================================

export type AgeBand = '13-15' | '16-17' | '18-25';
export type Jurisdiction = 'UA' | 'EU' | 'US' | 'UK';
export type SessionEndReason = 'time_up' | 'user_closed' | 'crisis_handoff' | 'therapist_handoff';
export type CrisisSeverity = 'elevated' | 'high' | 'imminent';
export type ReferralStatus = 'new' | 'accepted' | 'declined' | 'completed' | 'no_show';
export type ReferralUrgency = 'normal' | 'urgent';
export type ConsentType = 'share_summary' | 'share_profile' | 'crisis_handoff';
export type MessageRole = 'user' | 'assistant';

export interface ProposedSlot {
  datetime: string;
  duration_min: number;
  free: boolean;
}
