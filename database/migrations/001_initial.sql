-- This schema is separate from Neon Auth and other applications.
-- No demo records or existing application tables are modified.
CREATE SCHEMA IF NOT EXISTS ejder_ai;

CREATE TABLE ejder_ai.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  source text NOT NULL CHECK (source IN ('TURTAKIP', 'MANUAL')),
  external_source_id text,
  full_name text NOT NULL CHECK (length(trim(full_name)) BETWEEN 3 AND 100),
  phone text NOT NULL CHECK (length(phone) BETWEEN 10 AND 20),
  email text,
  city text,
  tour_id text,
  tour_name text NOT NULL,
  adult_count integer NOT NULL DEFAULT 1 CHECK (adult_count BETWEEN 1 AND 50),
  child_count integer NOT NULL DEFAULT 0 CHECK (child_count BETWEEN 0 AND 50),
  preferred_date date,
  budget text,
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 2000),
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'QUEUED', 'QUALIFIED', 'FOLLOW_UP', 'UNREACHABLE', 'NOT_INTERESTED', 'DRAFT')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_source_id),
  UNIQUE (id, is_demo),
  CHECK (source <> 'TURTAKIP' OR nullif(trim(external_source_id), '') IS NOT NULL)
);

CREATE INDEX leads_status_created_idx ON ejder_ai.leads (status, created_at DESC);

CREATE TABLE ejder_ai.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('MANUAL', 'VERIMOR')),
  provider_call_id text,
  outcome text NOT NULL CHECK (outcome IN ('QUALIFIED', 'FOLLOW_UP', 'UNREACHABLE', 'NOT_INTERESTED')),
  summary text NOT NULL CHECK (length(trim(summary)) BETWEEN 5 AND 2000),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_call_id),
  UNIQUE (id, lead_id, outcome, is_demo),
  FOREIGN KEY (lead_id, is_demo) REFERENCES ejder_ai.leads (id, is_demo) ON DELETE RESTRICT
);

CREATE INDEX calls_lead_created_idx ON ejder_ai.calls (lead_id, created_at DESC);

CREATE TABLE ejder_ai.reservation_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  lead_id uuid NOT NULL UNIQUE,
  call_id uuid NOT NULL,
  call_outcome text NOT NULL DEFAULT 'QUALIFIED' CHECK (call_outcome = 'QUALIFIED'),
  departure_id text NOT NULL CHECK (length(trim(departure_id)) > 0),
  departure_label text NOT NULL,
  passengers jsonb NOT NULL CHECK (jsonb_typeof(passengers) = 'array' AND jsonb_array_length(passengers) BETWEEN 1 AND 100),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_TRANSFER', 'TRANSFERRED', 'TRANSFER_FAILED')),
  transfer_request_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  turtakip_reservation_id text UNIQUE,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (call_id, lead_id, call_outcome, is_demo) REFERENCES ejder_ai.calls (id, lead_id, outcome, is_demo) ON DELETE RESTRICT,
  CHECK (NOT is_demo OR status = 'DRAFT'),
  CHECK (NOT is_demo OR turtakip_reservation_id IS NULL),
  CHECK (status <> 'TRANSFERRED' OR nullif(trim(turtakip_reservation_id), '') IS NOT NULL)
);

CREATE INDEX drafts_status_created_idx ON ejder_ai.reservation_drafts (status, created_at DESC);
