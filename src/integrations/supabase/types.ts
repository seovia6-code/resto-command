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
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          customer_id: string | null
          guest_name: string
          id: string
          notes: string | null
          party_size: number
          phone: string
          restaurant_id: string
          source: Database["public"]["Enums"]["request_source"]
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          customer_id?: string | null
          guest_name: string
          id?: string
          notes?: string | null
          party_size: number
          phone: string
          restaurant_id: string
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          customer_id?: string | null
          guest_name?: string
          id?: string
          notes?: string | null
          party_size?: number
          phone?: string
          restaurant_id?: string
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          caller_name: string | null
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          duration_seconds: number
          id: string
          intent: Database["public"]["Enums"]["call_intent"]
          outcome: Database["public"]["Enums"]["call_outcome"]
          phone: string
          recording_url: string | null
          restaurant_id: string
          started_at: string
          transcript: string | null
        }
        Insert: {
          caller_name?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number
          id?: string
          intent?: Database["public"]["Enums"]["call_intent"]
          outcome?: Database["public"]["Enums"]["call_outcome"]
          phone: string
          recording_url?: string | null
          restaurant_id: string
          started_at?: string
          transcript?: string | null
        }
        Update: {
          caller_name?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          duration_seconds?: number
          id?: string
          intent?: Database["public"]["Enums"]["call_intent"]
          outcome?: Database["public"]["Enums"]["call_outcome"]
          phone?: string
          recording_url?: string | null
          restaurant_id?: string
          started_at?: string
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: Database["public"]["Enums"]["conversation_channel"]
          created_at: string
          customer_id: string | null
          ended_at: string | null
          id: string
          intent: Database["public"]["Enums"]["call_intent"] | null
          restaurant_id: string
          started_at: string
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["conversation_channel"]
          created_at?: string
          customer_id?: string | null
          ended_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["call_intent"] | null
          restaurant_id: string
          started_at?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["conversation_channel"]
          created_at?: string
          customer_id?: string | null
          ended_at?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["call_intent"] | null
          restaurant_id?: string
          started_at?: string
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_contact_at: string | null
          name: string | null
          notes: string | null
          phone: string
          restaurant_id: string
          total_spent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string | null
          notes?: string | null
          phone: string
          restaurant_id: string
          total_spent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string
          restaurant_id?: string
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          id: string
          item_count: number
          items: Json
          order_type: Database["public"]["Enums"]["order_type"]
          phone: string | null
          placed_at: string
          restaurant_id: string
          source: Database["public"]["Enums"]["request_source"]
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          id?: string
          item_count?: number
          items?: Json
          order_type?: Database["public"]["Enums"]["order_type"]
          phone?: string | null
          placed_at?: string
          restaurant_id: string
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          id?: string
          item_count?: number
          items?: Json
          order_type?: Database["public"]["Enums"]["order_type"]
          phone?: string | null
          placed_at?: string
          restaurant_id?: string
          source?: Database["public"]["Enums"]["request_source"]
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          closes_at: string
          created_at: string
          id: string
          name: string
          opens_at: string
          owner_id: string
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          closes_at?: string
          created_at?: string
          id?: string
          name: string
          opens_at?: string
          owner_id: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          closes_at?: string
          created_at?: string
          id?: string
          name?: string
          opens_at?: string
          owner_id?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          contact_name: string | null
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          intent: Database["public"]["Enums"]["call_intent"]
          last_message: string | null
          last_message_at: string
          message_count: number
          phone: string
          restaurant_id: string
          status: Database["public"]["Enums"]["chat_status"]
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["call_intent"]
          last_message?: string | null
          last_message_at?: string
          message_count?: number
          phone: string
          restaurant_id: string
          status?: Database["public"]["Enums"]["chat_status"]
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          intent?: Database["public"]["Enums"]["call_intent"]
          last_message?: string | null
          last_message_at?: string
          message_count?: number
          phone?: string
          restaurant_id?: string
          status?: Database["public"]["Enums"]["chat_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_restaurant_owner: {
        Args: { _restaurant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show"
      call_intent: "booking" | "order" | "enquiry" | "complaint" | "other"
      call_outcome: "resolved" | "booked" | "missed" | "failed" | "transferred"
      chat_status: "active" | "pending" | "resolved" | "closed"
      conversation_channel: "call" | "whatsapp"
      order_status: "preparing" | "ready" | "delivered" | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      request_source: "call" | "whatsapp" | "web" | "walk_in"
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
      booking_status: [
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "no_show",
      ],
      call_intent: ["booking", "order", "enquiry", "complaint", "other"],
      call_outcome: ["resolved", "booked", "missed", "failed", "transferred"],
      chat_status: ["active", "pending", "resolved", "closed"],
      conversation_channel: ["call", "whatsapp"],
      order_status: ["preparing", "ready", "delivered", "cancelled"],
      order_type: ["dine_in", "takeaway", "delivery"],
      request_source: ["call", "whatsapp", "web", "walk_in"],
    },
  },
} as const
