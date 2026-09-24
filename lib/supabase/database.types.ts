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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      activity_log: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          house: Database["public"]["Enums"]["house_id"]
          id: number
          meta: Json
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          house: Database["public"]["Enums"]["house_id"]
          id?: never
          meta?: Json
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          house?: Database["public"]["Enums"]["house_id"]
          id?: never
          meta?: Json
        }
        Relationships: []
      }
      checkout_intents: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer: Json
          expires_at: string
          house: Database["public"]["Enums"]["house_id"]
          id: string
          last_error: string | null
          order_id: string | null
          payment_intent_id: string
          quote: Json
          status: Database["public"]["Enums"]["checkout_intent_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          customer: Json
          expires_at?: string
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          last_error?: string | null
          order_id?: string | null
          payment_intent_id: string
          quote: Json
          status?: Database["public"]["Enums"]["checkout_intent_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer?: Json
          expires_at?: string
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          last_error?: string | null
          order_id?: string | null
          payment_intent_id?: string
          quote?: Json
          status?: Database["public"]["Enums"]["checkout_intent_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          handled_by: string | null
          house: Database["public"]["Enums"]["house_id"]
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          handled_by?: string | null
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          handled_by?: string | null
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          allergens: string[]
          available: boolean
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          house: Database["public"]["Enums"]["house_id"]
          id: string
          image_path: string | null
          image_url: string | null
          name: string
          name_alt: string | null
          orderable: boolean
          price_cents: number
          spice_level: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          available?: boolean
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          image_path?: string | null
          image_url?: string | null
          name: string
          name_alt?: string | null
          orderable?: boolean
          price_cents: number
          spice_level?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          available?: boolean
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          image_path?: string | null
          image_url?: string | null
          name?: string
          name_alt?: string | null
          orderable?: boolean
          price_cents?: number
          spice_level?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_category_same_house_fkey"
            columns: ["category_id", "house"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id", "house"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          deleted_at: string | null
          entity_id: string | null
          entity_type: string | null
          error: string | null
          house: Database["public"]["Enums"]["house_id"]
          html: string | null
          id: string
          provider_id: string | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string | null
          to_email: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          house: Database["public"]["Enums"]["house_id"]
          html?: string | null
          id?: string
          provider_id?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string | null
          to_email: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          house?: Database["public"]["Enums"]["house_id"]
          html?: string | null
          id?: string
          provider_id?: string | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string | null
          to_email?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_banners: {
        Row: {
          body: string | null
          created_at: string
          display_order: number
          enabled: boolean
          ends_on: string
          house: Database["public"]["Enums"]["house_id"]
          id: string
          image_path: string
          image_url: string
          link_url: string | null
          show_on_home: boolean
          starts_on: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          display_order?: number
          enabled?: boolean
          ends_on: string
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          image_path: string
          image_url: string
          link_url?: string | null
          show_on_home?: boolean
          starts_on: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          display_order?: number
          enabled?: boolean
          ends_on?: string
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          image_path?: string
          image_url?: string
          link_url?: string | null
          show_on_home?: boolean
          starts_on?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      house_closures: {
        Row: {
          created_at: string
          created_by: string | null
          ends_on: string
          house: Database["public"]["Enums"]["house_id"]
          id: string
          reason: string | null
          scope: Database["public"]["Enums"]["closure_scope"]
          starts_on: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_on: string
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          reason?: string | null
          scope?: Database["public"]["Enums"]["closure_scope"]
          starts_on: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_on?: string
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          reason?: string | null
          scope?: Database["public"]["Enums"]["closure_scope"]
          starts_on?: string
        }
        Relationships: []
      }
      house_ops: {
        Row: {
          address_line: string | null
          city: string | null
          closed_weekdays: number[]
          contact_email: string | null
          continuous: boolean
          dinner_close: string | null
          dinner_open: string | null
          display_name: string | null
          email_from_name: string | null
          hours_label: string
          hours_note: string
          house: Database["public"]["Enums"]["house_id"]
          lunch_close: string | null
          lunch_open: string | null
          phone: string
          phone_href: string
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          city?: string | null
          closed_weekdays?: number[]
          contact_email?: string | null
          continuous?: boolean
          dinner_close?: string | null
          dinner_open?: string | null
          display_name?: string | null
          email_from_name?: string | null
          hours_label: string
          hours_note: string
          house: Database["public"]["Enums"]["house_id"]
          lunch_close?: string | null
          lunch_open?: string | null
          phone: string
          phone_href: string
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          city?: string | null
          closed_weekdays?: number[]
          contact_email?: string | null
          continuous?: boolean
          dinner_close?: string | null
          dinner_open?: string | null
          display_name?: string | null
          email_from_name?: string | null
          hours_label?: string
          hours_note?: string
          house?: Database["public"]["Enums"]["house_id"]
          lunch_close?: string | null
          lunch_open?: string | null
          phone?: string
          phone_href?: string
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          created_at: string
          display_order: number
          house: Database["public"]["Enums"]["house_id"]
          id: string
          is_active: boolean
          is_drinks: boolean
          name: string
          name_alt: string | null
          orderable: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          is_active?: boolean
          is_drinks?: boolean
          name: string
          name_alt?: string | null
          orderable?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          is_active?: boolean
          is_drinks?: boolean
          name?: string
          name_alt?: string | null
          orderable?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          dish_id: string | null
          dish_name: string
          house: Database["public"]["Enums"]["house_id"]
          id: string
          line_total_cents: number
          notes: string | null
          order_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          dish_id?: string | null
          dish_name: string
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          line_total_cents: number
          notes?: string | null
          order_id: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          dish_id?: string | null
          dish_name?: string
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          line_total_cents?: number
          notes?: string | null
          order_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_dish_same_house_fkey"
            columns: ["dish_id", "house"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id", "house"]
          },
          {
            foreignKeyName: "order_items_order_same_house_fkey"
            columns: ["order_id", "house"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id", "house"]
          },
        ]
      }
      ordering_settings: {
        Row: {
          cash_on_pickup_enabled: boolean
          delivery_enabled: boolean
          delivery_eta_minutes: number
          delivery_fee_cents: number
          delivery_min_cents: number
          delivery_postcodes: string[]
          house: Database["public"]["Enums"]["house_id"]
          last_order_minutes_before_close: number
          paused_until: string | null
          prep_minutes: number
          takeaway_discount_pct: number
          takeaway_enabled: boolean
          takeaway_fee_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cash_on_pickup_enabled?: boolean
          delivery_enabled?: boolean
          delivery_eta_minutes?: number
          delivery_fee_cents?: number
          delivery_min_cents?: number
          delivery_postcodes?: string[]
          house: Database["public"]["Enums"]["house_id"]
          last_order_minutes_before_close?: number
          paused_until?: string | null
          prep_minutes?: number
          takeaway_discount_pct?: number
          takeaway_enabled?: boolean
          takeaway_fee_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cash_on_pickup_enabled?: boolean
          delivery_enabled?: boolean
          delivery_eta_minutes?: number
          delivery_fee_cents?: number
          delivery_min_cents?: number
          delivery_postcodes?: string[]
          house?: Database["public"]["Enums"]["house_id"]
          last_order_minutes_before_close?: number
          paused_until?: string | null
          prep_minutes?: number
          takeaway_discount_pct?: number
          takeaway_enabled?: boolean
          takeaway_fee_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          cancel_reason: string | null
          cancel_token: string
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_note: string | null
          customer_phone: string
          deleted_at: string | null
          delivery_address: Json | null
          discount_cents: number
          fee_cents: number
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          house: Database["public"]["Enums"]["house_id"]
          id: string
          internal_note: string | null
          needs_review: boolean
          order_number: string
          paid_at: string | null
          payment_intent_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          ready_at: string | null
          refunded_cents: number
          requested_time: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_label: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          cancel_token?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_note?: string | null
          customer_phone: string
          deleted_at?: string | null
          delivery_address?: Json | null
          discount_cents?: number
          fee_cents?: number
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          internal_note?: string | null
          needs_review?: boolean
          order_number: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          ready_at?: string | null
          refunded_cents?: number
          requested_time?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_label?: string | null
          subtotal_cents: number
          total_cents: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          cancel_token?: string
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_note?: string | null
          customer_phone?: string
          deleted_at?: string | null
          delivery_address?: Json | null
          discount_cents?: number
          fee_cents?: number
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          internal_note?: string | null
          needs_review?: boolean
          order_number?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          ready_at?: string | null
          refunded_cents?: number
          requested_time?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_label?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          cancel_token: string
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          id: string
          note: string | null
          service_date: string
          slot: unknown
          source: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        Insert: {
          cancel_token?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests: number
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          note?: string | null
          service_date: string
          slot?: unknown
          source?: string
          start_time: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at?: string
        }
        Update: {
          cancel_token?: string
          cancelled_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests?: number
          hold_minutes?: number
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          note?: string | null
          service_date?: string
          slot?: unknown
          source?: string
          start_time?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_same_house_fkey"
            columns: ["table_id", "house"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id", "house"]
          },
        ]
      }
      settings: {
        Row: {
          booking_horizon_days: number
          cancel_email_body: string | null
          cancel_email_subject: string | null
          confirm_email_body: string | null
          confirm_email_subject: string | null
          guest_email_body: string | null
          guest_email_subject: string | null
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          house_email_body: string | null
          house_email_subject: string | null
          max_party_size: number
          min_lead_minutes: number
          notify_email: string | null
          reservations_enabled: boolean
          time_slots: string[]
          updated_at: string
        }
        Insert: {
          booking_horizon_days?: number
          cancel_email_body?: string | null
          cancel_email_subject?: string | null
          confirm_email_body?: string | null
          confirm_email_subject?: string | null
          guest_email_body?: string | null
          guest_email_subject?: string | null
          hold_minutes?: number
          house: Database["public"]["Enums"]["house_id"]
          house_email_body?: string | null
          house_email_subject?: string | null
          max_party_size?: number
          min_lead_minutes?: number
          notify_email?: string | null
          reservations_enabled?: boolean
          time_slots?: string[]
          updated_at?: string
        }
        Update: {
          booking_horizon_days?: number
          cancel_email_body?: string | null
          cancel_email_subject?: string | null
          confirm_email_body?: string | null
          confirm_email_subject?: string | null
          guest_email_body?: string | null
          guest_email_subject?: string | null
          hold_minutes?: number
          house?: Database["public"]["Enums"]["house_id"]
          house_email_body?: string | null
          house_email_subject?: string | null
          max_party_size?: number
          min_lead_minutes?: number
          notify_email?: string | null
          reservations_enabled?: boolean
          time_slots?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string
          featured_dish_ids: string[]
          home_banner_left: string | null
          home_banner_right: string | null
          id: boolean
          updated_at: string
        }
        Insert: {
          contact_email?: string
          featured_dish_ids?: string[]
          home_banner_left?: string | null
          home_banner_right?: string | null
          id?: boolean
          updated_at?: string
        }
        Update: {
          contact_email?: string
          featured_dish_ids?: string[]
          home_banner_left?: string | null
          home_banner_right?: string | null
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          display_name: string | null
          house: Database["public"]["Enums"]["house_id"] | null
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          house?: Database["public"]["Enums"]["house_id"] | null
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          house?: Database["public"]["Enums"]["house_id"] | null
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tables: {
        Row: {
          active: boolean
          created_at: string
          house: Database["public"]["Enums"]["house_id"]
          id: string
          number: number
          seats: number
          sort_order: number
          updated_at: string
          zone: Database["public"]["Enums"]["table_zone"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          house: Database["public"]["Enums"]["house_id"]
          id?: string
          number: number
          seats: number
          sort_order?: number
          updated_at?: string
          zone: Database["public"]["Enums"]["table_zone"]
        }
        Update: {
          active?: boolean
          created_at?: string
          house?: Database["public"]["Enums"]["house_id"]
          id?: string
          number?: number
          seats?: number
          sort_order?: number
          updated_at?: string
          zone?: Database["public"]["Enums"]["table_zone"]
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_today: {
        Row: {
          active_orders: number | null
          blocked: number | null
          cancelled: number | null
          cash_to_collect: number | null
          confirmed: number | null
          covers_expected: number | null
          held: number | null
          house: Database["public"]["Enums"]["house_id"] | null
          new_messages: number | null
          no_show: number | null
          orders_today: number | null
          released: number | null
          revenue_today_cents: number | null
          service_date: string | null
        }
        Relationships: []
      }
      admin_service_board: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          end_time: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number | null
          hold_minutes: number | null
          house: Database["public"]["Enums"]["house_id"] | null
          id: string | null
          note: string | null
          seats: number | null
          service_date: string | null
          source: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          table_id: string | null
          table_number: number | null
          zone: Database["public"]["Enums"]["table_zone"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_same_house_fkey"
            columns: ["table_id", "house"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id", "house"]
          },
        ]
      }
    }
    Functions: {
      checkout_create_order: {
        Args: {
          p_customer: Json
          p_house: Database["public"]["Enums"]["house_id"]
          p_payment: Json
          p_quote: Json
        }
        Returns: {
          created: boolean
          order_id: string
          order_number: string
        }[]
      }
      checkout_quote: {
        Args: {
          p_fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          p_house: Database["public"]["Enums"]["house_id"]
          p_items: Json
          p_payment_method?: Database["public"]["Enums"]["payment_method"]
          p_postcode?: string
        }
        Returns: Json
      }
      get_availability: {
        Args: {
          p_date: string
          p_guests?: number
          p_house: Database["public"]["Enums"]["house_id"]
        }
        Returns: Json
      }
      get_ordering_status: {
        Args: { p_house: Database["public"]["Enums"]["house_id"] }
        Returns: Json
      }
      monthly_report: {
        Args: {
          p_house: Database["public"]["Enums"]["house_id"]
          p_month: number
          p_year: number
        }
        Returns: Json
      }
      place_hold: {
        Args: {
          p_date: string
          p_email: string
          p_guests: number
          p_hold_minutes: number
          p_house: Database["public"]["Enums"]["house_id"]
          p_name: string
          p_note: string
          p_phone: string
          p_start: string
          p_status?: Database["public"]["Enums"]["reservation_status"]
          p_table_id: string
        }
        Returns: {
          cancel_token: string
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          id: string
          note: string | null
          service_date: string
          slot: unknown
          source: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      report_summary: {
        Args: {
          p_from: string
          p_house: Database["public"]["Enums"]["house_id"]
          p_to: string
        }
        Returns: Json
      }
      set_hold_minutes: {
        Args: { p_hold_minutes: number; p_reservation_id: string }
        Returns: {
          cancel_token: string
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          id: string
          note: string | null
          service_date: string
          slot: unknown
          source: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_reservation_status: {
        Args: {
          p_reservation_id: string
          p_status: Database["public"]["Enums"]["reservation_status"]
        }
        Returns: {
          cancel_token: string
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          id: string
          note: string | null
          service_date: string
          slot: unknown
          source: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_reservation_table: {
        Args: { p_reservation_id: string; p_table_id: string }
        Returns: {
          cancel_token: string
          cancelled_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          hold_minutes: number
          house: Database["public"]["Enums"]["house_id"]
          id: string
          note: string | null
          service_date: string
          slot: unknown
          source: string
          start_time: string
          status: Database["public"]["Enums"]["reservation_status"]
          table_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      checkout_intent_status:
        | "pending"
        | "completed"
        | "failed"
        | "abandoned"
        | "expired"
      closure_scope: "all" | "reservations" | "orders"
      email_status: "queued" | "sent" | "failed" | "skipped"
      fulfillment_type: "pickup" | "delivery"
      house_id: "montmartre" | "poissonniere"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "completed"
        | "cancelled"
      payment_method: "card" | "cash"
      payment_status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      reservation_status:
        | "held"
        | "released"
        | "blocked"
        | "confirmed"
        | "cancelled"
        | "no_show"
      staff_role: "staff" | "owner"
      table_zone: "salle" | "terrasse"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      checkout_intent_status: [
        "pending",
        "completed",
        "failed",
        "abandoned",
        "expired",
      ],
      closure_scope: ["all", "reservations", "orders"],
      email_status: ["queued", "sent", "failed", "skipped"],
      fulfillment_type: ["pickup", "delivery"],
      house_id: ["montmartre", "poissonniere"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "completed",
        "cancelled",
      ],
      payment_method: ["card", "cash"],
      payment_status: [
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      reservation_status: [
        "held",
        "released",
        "blocked",
        "confirmed",
        "cancelled",
        "no_show",
      ],
      staff_role: ["staff", "owner"],
      table_zone: ["salle", "terrasse"],
    },
  },
} as const
