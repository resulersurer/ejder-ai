CREATE TABLE ejder_ai.tour_ai_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turtakip_tour_id text NOT NULL UNIQUE,
  tour_name text NOT NULL CHECK (length(trim(tour_name)) BETWEEN 2 AND 200),
  tour_slug text NOT NULL,
  phone_number text NOT NULL CHECK (phone_number ~ '^\+[1-9][0-9]{7,14}$'),
  ai_agent_key text NOT NULL CHECK (ai_agent_key IN ('SALES', 'INFORMATION', 'FOLLOW_UP')),
  ai_display_name text NOT NULL CHECK (length(trim(ai_display_name)) BETWEEN 2 AND 80),
  instructions text NOT NULL DEFAULT '' CHECK (length(instructions) <= 4000),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tour_ai_configurations_enabled_idx
  ON ejder_ai.tour_ai_configurations (enabled, updated_at DESC);
