create table if not exists public.agentproof_reports (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid not null references public.agentproof_connectors(id) on delete cascade,
  job_id uuid not null unique references public.agentproof_connector_jobs(id) on delete cascade,
  agent_name text not null,
  evidence_digest text not null check (evidence_digest ~ '^[a-f0-9]{64}$'),
  score integer not null check (score between 0 and 100),
  readiness text not null check (readiness in ('ready', 'conditional', 'failed')),
  total_trials integer not null check (total_trials between 1 and 10000),
  passed_trials integer not null check (passed_trials between 0 and total_trials),
  failed_trials integer not null check (failed_trials between 0 and total_trials),
  blocked_trials integer not null check (blocked_trials between 0 and total_trials),
  escalated_trials integer not null check (escalated_trials between 0 and total_trials),
  intercepted_actions integer not null check (intercepted_actions >= 0),
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists agentproof_reports_connector_created_idx
  on public.agentproof_reports (connector_id, created_at desc);

alter table public.agentproof_reports enable row level security;
revoke all on public.agentproof_reports from public, anon, authenticated;
grant select, insert, update, delete on public.agentproof_reports to service_role;
