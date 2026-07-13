/**
 * Supabase 类型定义
 * MVP 阶段手写，避免依赖 supabase CLI
 */

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string
          title: string
          starting_city: string
          is_active: boolean
          created_at: string
          last_activity_at: string
          ended_at: string | null
          ended_by: string | null
        }
        Insert: {
          id?: string
          title: string
          starting_city: string
          is_active?: boolean
          created_at?: string
          last_activity_at?: string
          ended_at?: string | null
          ended_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['rooms']['Insert']>
      }
      scenes: {
        Row: {
          id: string
          room_id: string
          order_index: number
          description: string
          image_url: string | null
          image_keyword: string | null
          options: SceneOption[]
          winning_option_id: string | null
          voting_ends_at: string
          advanced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          order_index: number
          description: string
          image_url?: string | null
          image_keyword?: string | null
          options: SceneOption[]
          winning_option_id?: string | null
          voting_ends_at: string
          advanced_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['scenes']['Insert']>
      }
      votes: {
        Row: {
          id: string
          scene_id: string
          user_ephemeral_id: string
          user_nickname: string
          option_id: string
          created_at: string
        }
        Insert: {
          id?: string
          scene_id: string
          user_ephemeral_id: string
          user_nickname: string
          option_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['votes']['Insert']>
      }
    }
    Functions: {
      claim_scene_advance: {
        Args: { target_scene_id: string }
        Returns: boolean
      }
    }
  }
}

export type SceneOption = {
  id: string
  label: string
}

export type Room = Database['public']['Tables']['rooms']['Row']
export type Scene = Database['public']['Tables']['scenes']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
