export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      asr_output: {
        Row: {
          file: string
          id: number
          output: string | null
          score: number | null
        }
        Insert: {
          file: string
          id?: number
          output?: string | null
          score?: number | null
        }
        Update: {
          file?: string
          id?: number
          output?: string | null
          score?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          chat: Json
          chat_id: number | null
          date: string | null
          id: number
          token_usage: number
          topics: string | null
          userId: string
        }
        Insert: {
          chat: Json
          chat_id?: number | null
          date?: string | null
          id?: number
          token_usage?: number
          topics?: string | null
          userId: string
        }
        Update: {
          chat?: Json
          chat_id?: number | null
          date?: string | null
          id?: number
          token_usage?: number
          topics?: string | null
          userId?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          created_at: string
          id: number
          prompt: string
          starter: string | null
          topics: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          prompt: string
          starter?: string | null
          topics?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          prompt?: string
          starter?: string | null
          topics?: string | null
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
