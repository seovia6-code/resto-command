-- Enums
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE public.order_status AS ENUM ('preparing', 'ready', 'delivered', 'cancelled');
CREATE TYPE public.order_type AS ENUM ('dine_in', 'takeaway', 'delivery');
CREATE TYPE public.request_source AS ENUM ('call', 'whatsapp', 'web', 'walk_in');
CREATE TYPE public.call_outcome AS ENUM ('resolved', 'booked', 'missed', 'failed', 'transferred');
CREATE TYPE public.call_intent AS ENUM ('booking', 'order', 'enquiry', 'complaint', 'other');
CREATE TYPE public.chat_status AS ENUM ('active', 'pending', 'resolved', 'closed');
CREATE TYPE public.conversation_channel AS ENUM ('call', 'whatsapp');

-- Restaurants
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  opens_at TIME NOT NULL DEFAULT '11:00',
  closes_at TIME NOT NULL DEFAULT '23:30',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX restaurants_owner_idx ON public.restaurants(owner_id);

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  total_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, phone)
);
CREATE INDEX customers_restaurant_idx ON public.customers(restaurant_id);

-- Conversations (unified thread)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  channel public.conversation_channel NOT NULL,
  intent public.call_intent,
  status TEXT NOT NULL DEFAULT 'open',
  summary TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX conversations_restaurant_idx ON public.conversations(restaurant_id);
CREATE INDEX conversations_customer_idx ON public.conversations(customer_id);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  party_size INT NOT NULL CHECK (party_size > 0),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  source public.request_source NOT NULL DEFAULT 'call',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX bookings_restaurant_date_idx ON public.bookings(restaurant_id, booking_date);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INT NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_type public.order_type NOT NULL DEFAULT 'dine_in',
  status public.order_status NOT NULL DEFAULT 'preparing',
  source public.request_source NOT NULL DEFAULT 'call',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_restaurant_placed_idx ON public.orders(restaurant_id, placed_at DESC);

-- Call logs
CREATE TABLE public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  caller_name TEXT,
  phone TEXT NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  intent public.call_intent NOT NULL DEFAULT 'other',
  outcome public.call_outcome NOT NULL DEFAULT 'resolved',
  recording_url TEXT,
  transcript TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX call_logs_restaurant_started_idx ON public.call_logs(restaurant_id, started_at DESC);

-- WhatsApp logs
CREATE TABLE public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  contact_name TEXT,
  phone TEXT NOT NULL,
  last_message TEXT,
  intent public.call_intent NOT NULL DEFAULT 'other',
  status public.chat_status NOT NULL DEFAULT 'active',
  message_count INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_logs_restaurant_msg_idx ON public.whatsapp_logs(restaurant_id, last_message_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_restaurants_updated BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_whatsapp_logs_updated BEFORE UPDATE ON public.whatsapp_logs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Security definer helper to avoid recursive RLS
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = _restaurant_id AND owner_id = auth.uid()
  );
$$;

-- Enable RLS
ALTER TABLE public.restaurants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs  ENABLE ROW LEVEL SECURITY;

-- Restaurants policies (owner = auth.uid())
CREATE POLICY "Owners view their restaurants" ON public.restaurants
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners create their restaurants" ON public.restaurants
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update their restaurants" ON public.restaurants
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete their restaurants" ON public.restaurants
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- Generic policies via helper for child tables
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','conversations','bookings','orders','call_logs','whatsapp_logs']
  LOOP
    EXECUTE format('CREATE POLICY "Owners view %I" ON public.%I FOR SELECT TO authenticated USING (public.is_restaurant_owner(restaurant_id));', t, t);
    EXECUTE format('CREATE POLICY "Owners insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_restaurant_owner(restaurant_id));', t, t);
    EXECUTE format('CREATE POLICY "Owners update %I" ON public.%I FOR UPDATE TO authenticated USING (public.is_restaurant_owner(restaurant_id)) WITH CHECK (public.is_restaurant_owner(restaurant_id));', t, t);
    EXECUTE format('CREATE POLICY "Owners delete %I" ON public.%I FOR DELETE TO authenticated USING (public.is_restaurant_owner(restaurant_id));', t, t);
  END LOOP;
END $$;