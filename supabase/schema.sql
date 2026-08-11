-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: organizations (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cr_number TEXT,
    city TEXT,
    address TEXT,
    owner_id UUID NOT NULL, -- references auth.users
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY, -- references auth.users
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: settings
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_name TEXT,
    vat_number TEXT,
    cr_number TEXT,
    city TEXT,
    district TEXT,
    street TEXT,
    postal_code TEXT,
    building_number TEXT,
    vat_rate NUMERIC DEFAULT 15,
    daily_volume_target INTEGER DEFAULT 30,
    working_days INTEGER DEFAULT 30,
    avg_service_price NUMERIC DEFAULT 40,
    loyalty_target INTEGER DEFAULT 10,
    currency TEXT DEFAULT 'SAR',
    language TEXT DEFAULT 'ar',
    logo_url TEXT,
    phone TEXT,
    address TEXT,
    brand_color TEXT DEFAULT '#0e7490',
    brand_accent TEXT DEFAULT '#2563eb',
    whatsapp_in_progress TEXT,
    whatsapp_completed TEXT,
    whatsapp_delivered TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    plate_number TEXT,
    vehicle_type TEXT,
    vehicle_brand TEXT,
    vehicle_model TEXT,
    loyalty_stamps INTEGER DEFAULT 0,
    free_washes_earned INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: products_services (Products and Services)
CREATE TABLE IF NOT EXISTS public.products_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    cost_estimate NUMERIC,
    duration_min INTEGER,
    is_product BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: sales (Invoices)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: sale_items
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products_services(id) ON DELETE SET NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: purchases (Expenses)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_name TEXT,
    description TEXT NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: job_cards
CREATE TABLE IF NOT EXISTS public.job_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    assigned_worker TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT organization_id INTO v_tenant_id FROM public.profiles WHERE id = auth.uid();
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations Policy: Users can only select their own organization
CREATE POLICY "Users can view their own organization"
    ON public.organizations
    FOR SELECT
    USING (id = public.get_current_tenant_id());

-- Profiles Policy: Users can view profiles in their own organization
CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles
    FOR SELECT
    USING (organization_id = public.get_current_tenant_id());

-- Generic Policies for Tenant-based tables
CREATE POLICY "Tenant isolation for settings" ON public.settings
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant isolation for customers" ON public.customers
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant isolation for products_services" ON public.products_services
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant isolation for sales" ON public.sales
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant isolation for sale_items" ON public.sale_items
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant isolation for purchases" ON public.purchases
    FOR ALL USING (tenant_id = public.get_current_tenant_id());

CREATE POLICY "Tenant isolation for job_cards" ON public.job_cards
    FOR ALL USING (tenant_id = public.get_current_tenant_id());
