export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_id: string;
          created_at: string;
          plan: "free" | "pro" | "scale";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status:
            | "trialing"
            | "active"
            | "past_due"
            | "canceled"
            | "unpaid"
            | "incomplete"
            | "incomplete_expired"
            | null;
          current_period_end: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      memberships: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["memberships"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
      };
      agents: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          persona: string;
          opening_line: string;
          voice_provider: string;
          voice_id: string;
          llm_provider: string;
          llm_model: string;
          temperature: number;
          max_duration_seconds: number;
          knowledge_base_id: string | null;
          tools: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["agents"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["agents"]["Insert"]>;
      };
      knowledge_bases: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          embedding_model: string;
          doc_count: number;
          chunk_count: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["knowledge_bases"]["Row"],
          "id" | "created_at" | "doc_count" | "chunk_count"
        >;
        Update: Partial<Database["public"]["Tables"]["knowledge_bases"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          kb_id: string;
          name: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          status: "pending" | "processing" | "ready" | "failed";
          error: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      phone_numbers: {
        Row: {
          id: string;
          org_id: string;
          e164: string;
          friendly_name: string | null;
          provider: "twilio" | "telnyx";
          provider_sid: string | null;
          agent_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["phone_numbers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["phone_numbers"]["Insert"]>;
      };
      calls: {
        Row: {
          id: string;
          org_id: string;
          agent_id: string | null;
          phone_number_id: string | null;
          campaign_id: string | null;
          contact_id: string | null;
          direction: "inbound" | "outbound";
          from_number: string;
          to_number: string;
          status: "queued" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer";
          started_at: string | null;
          ended_at: string | null;
          duration_seconds: number;
          cost_cents: number;
          recording_url: string | null;
          transcript_url: string | null;
          summary: string | null;
          outcome: string | null;
          sentiment: "positive" | "neutral" | "negative" | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["calls"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["calls"]["Insert"]>;
      };
      call_events: {
        Row: {
          id: string;
          call_id: string;
          at: string;
          kind: string;
          payload: Json;
        };
        Insert: Omit<Database["public"]["Tables"]["call_events"]["Row"], "id" | "at">;
        Update: Partial<Database["public"]["Tables"]["call_events"]["Insert"]>;
      };
      api_keys: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          last_used: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["api_keys"]["Row"],
          "id" | "created_at" | "last_used" | "revoked_at"
        >;
        Update: Partial<Database["public"]["Tables"]["api_keys"]["Insert"]>;
      };
      campaigns: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          agent_id: string;
          directive: string;
          from_number_id: string;
          status: "draft" | "scheduled" | "running" | "paused" | "completed" | "cancelled";
          concurrency: number;
          retries: number;
          retry_delay_minutes: number;
          schedule_start: string | null;
          schedule_window_start: string | null;
          schedule_window_end: string | null;
          total_contacts: number;
          completed_contacts: number;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["campaigns"]["Row"],
          "id" | "created_at" | "total_contacts" | "completed_contacts"
        >;
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
      };
      campaign_contacts: {
        Row: {
          id: string;
          campaign_id: string;
          name: string | null;
          phone: string;
          variables: Json;
          status: "pending" | "calling" | "done" | "failed" | "skipped";
          attempts: number;
          last_call_id: string | null;
          outcome: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["campaign_contacts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["campaign_contacts"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_chunks: {
        Args: { query_embedding: number[]; kb_id: string; match_count?: number };
        Returns: Array<{ id: string; document_id: string; content: string; similarity: number }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
