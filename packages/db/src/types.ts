// Типи генеруються з Supabase схеми — оновлювати через `supabase gen types typescript`

export type AgeBand = '13-15' | '16-17' | '18-25';
export type Jurisdiction = 'UA' | 'EU' | 'US' | 'UK';
export type SessionEndReason = 'time_up' | 'user_closed' | 'crisis_handoff' | 'therapist_handoff';
export type CrisisSeverity = 'elevated' | 'high' | 'imminent';
export type ReferralStatus = 'new' | 'accepted' | 'declined' | 'completed' | 'no_show';
export type ReferralUrgency = 'normal' | 'urgent';
export type ConsentType = 'share_summary' | 'share_profile' | 'crisis_handoff';
export type MessageRole = 'user' | 'assistant';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          age_band: AgeBand;
          locale: string;
          jurisdiction: Jurisdiction;
          parental_consent_status: 'pending' | 'granted' | 'na' | null;
          parental_consent_method: string | null;
          created_at: string;
          last_seen_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<
          Database['public']['Tables']['users']['Row'],
          'id' | 'created_at' | 'last_seen_at'
        >;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          theme: string | null;
          started_at: string;
          ended_at: string | null;
          end_reason: SessionEndReason | null;
          modes_sequence: number[] | null;
          fm_dominant: number | null;
          graduation_completed: boolean;
        };
        Insert: Omit<
          Database['public']['Tables']['sessions']['Row'],
          'id' | 'started_at' | 'graduation_completed'
        >;
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: MessageRole;
          content: string;
          mode: number | null;
          fm_detected: number | null;
          principle_applied: string | null;
          created_at: string;
          flagged_for_review: boolean;
          prompt_version: string | null; // added in migration 002, default bumped to 'v1.4' in 003
        };
        Insert: Omit<
          Database['public']['Tables']['messages']['Row'],
          'id' | 'created_at' | 'flagged_for_review'
        >;
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
      crisis_events: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          trigger_message_id: string | null;
          severity: CrisisSeverity;
          detection_method: string | null;
          jurisdiction: Jurisdiction;
          hotlines_shown: string[] | null;
          user_action: string | null;
          // Renamed in migration 002 (wellness-positioning): clinical_* → review_*
          review_at: string | null;
          review_by: string | null;
          review_notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['crisis_events']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['crisis_events']['Insert']>;
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
          jurisdictions: Jurisdiction[];
          languages: string[];
          modalities: string[] | null;
          city: string | null;
          country: string | null;
          free_first_session: boolean;
          active: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['therapists']['Row'],
          'id' | 'created_at' | 'active' | 'free_first_session'
        >;
        Update: Partial<Database['public']['Tables']['therapists']['Insert']>;
      };
      referrals: {
        Row: {
          id: string;
          session_id: string | null;
          user_id: string;
          therapist_id: string | null;
          status: ReferralStatus;
          urgency: ReferralUrgency;
          theme: string | null;
          age_band: AgeBand | null;
          jurisdiction: Jurisdiction | null;
          modes_sequence: number[] | null;
          summary: string | null;
          summary_approved_by_teen: boolean;
          summary_approved_at: string | null;
          consent_log_id: string | null;
          proposed_slots: ProposedSlot[] | null;
          accepted_slot: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['referrals']['Row'],
          'id' | 'created_at' | 'status' | 'urgency' | 'summary_approved_by_teen'
        >;
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>;
      };
      consent_log: {
        Row: {
          id: string;
          user_id: string;
          consent_type: ConsentType;
          scope: string;
          granted: boolean;
          granted_at: string;
          withdrawn_at: string | null;
          evidence: Record<string, unknown> | null;
        };
        Insert: Omit<Database['public']['Tables']['consent_log']['Row'], 'id' | 'granted_at'>;
        Update: Partial<Database['public']['Tables']['consent_log']['Insert']>;
      };
    };
  };
}

export interface ProposedSlot {
  datetime: string;
  duration_min: number;
  free: boolean;
}
