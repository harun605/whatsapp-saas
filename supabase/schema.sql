-- =============================================
-- WHATSAPP SAAS - VERİTABANI YAPISI
-- Supabase'e kopyala yapıştır yeterli
-- =============================================


-- 1. KLİNİKLER (her müşteri = bir satır)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),

  -- Klinik bilgileri
  business_name text not null,          -- "Dt. Ayşe Kaya Kliniği"
  business_type text default 'dental',  -- dental, beauty, restaurant...
  phone text,                           -- klinik telefonu
  address text,

  -- WhatsApp ayarları
  whatsapp_number text,                 -- botun kullandığı numara
  whatsapp_token text,                  -- Meta API token
  whatsapp_phone_id text,               -- Meta phone ID

  -- Çalışma saatleri (JSON)
  working_hours jsonb default '{
    "monday":    {"open": "09:00", "close": "18:00"},
    "tuesday":   {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday":  {"open": "09:00", "close": "18:00"},
    "friday":    {"open": "09:00", "close": "18:00"},
    "saturday":  {"open": "10:00", "close": "14:00"},
    "sunday":    null
  }',

  -- Sunulan hizmetler (JSON listesi)
  services jsonb default '["Muayene", "Dolgu", "Kanal Tedavisi", "Diş Çekimi", "Temizlik"]',

  -- AI'ın nasıl davranacağı
  ai_prompt text default 'Sen bir diş kliniği asistanısın. Nazik ve profesyonel ol. Randevu al, bilgi ver.',

  -- Abonelik
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'trial',            -- trial, starter, pro, clinic
  plan_status text default 'active',    -- active, cancelled, past_due
  trial_ends_at timestamp default (now() + interval '14 days'),

  -- Bot durumu
  bot_active boolean default false
);


-- 2. HASTALAR
create table patients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  tenant_id uuid references tenants(id) on delete cascade,

  name text,                            -- hasta adı (bot öğrenir)
  whatsapp_number text not null,        -- 905321234567
  last_seen timestamp default now(),

  -- Her tenant'ın kendi hastası ayrı
  unique(tenant_id, whatsapp_number)
);


-- 3. RANDEVULAR
create table appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  tenant_id uuid references tenants(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,

  service text,                         -- "Dolgu"
  appointment_date date not null,
  appointment_time time not null,
  duration_minutes int default 30,

  status text default 'confirmed',      -- confirmed, cancelled, completed, no_show
  notes text,

  -- Hatırlatma gönderildi mi?
  reminder_24h_sent boolean default false,
  reminder_2h_sent boolean default false
);


-- 4. WHATSAPP KONUŞMALARI
create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  tenant_id uuid references tenants(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,

  -- Konuşma geçmişi (OpenAI'a gönderilir)
  messages jsonb default '[]',

  -- Son mesaj zamanı
  last_message_at timestamp default now(),

  -- Aktif konuşma mı? (30 dk sessizlik = kapandı)
  is_active boolean default true
);


-- 5. MESAJLAR (log amaçlı)
create table messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),
  tenant_id uuid references tenants(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,

  direction text not null,              -- inbound (hastadan) | outbound (botten)
  content text not null,
  message_id text                       -- Meta'nın mesaj ID'si
);


-- =============================================
-- GÜVENLİK: Her klinik sadece kendi verisini görsün
-- =============================================

alter table tenants enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- Klinik sahibi sadece kendi kliniğini görür
create policy "tenant_isolation" on tenants
  for all using (id = auth.uid());

-- Hastalar sadece ilgili tenant tarafından görülür
create policy "patient_isolation" on patients
  for all using (tenant_id = auth.uid());

create policy "appointment_isolation" on appointments
  for all using (tenant_id = auth.uid());

create policy "conversation_isolation" on conversations
  for all using (tenant_id = auth.uid());

create policy "message_isolation" on messages
  for all using (tenant_id = auth.uid());


-- =============================================
-- HIZLANDIRICI İNDEKSLER
-- =============================================

create index on patients(tenant_id, whatsapp_number);
create index on appointments(tenant_id, appointment_date);
create index on appointments(status);
create index on conversations(tenant_id, last_message_at);
create index on messages(conversation_id, created_at);
