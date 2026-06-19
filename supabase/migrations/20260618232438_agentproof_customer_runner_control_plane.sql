create extension if not exists pgcrypto;

create table if not exists public.agentproof_admin_keys (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  label text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.agentproof_connectors (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  runner_token_hash text not null unique check (runner_token_hash ~ '^[a-f0-9]{64}$'),
  runner_public_key jsonb not null,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.agentproof_connector_jobs (
  id uuid primary key default gen_random_uuid(),
  connector_id uuid not null references public.agentproof_connectors(id) on delete cascade,
  nonce uuid not null default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued', 'leased', 'completed', 'expired', 'failed')),
  payload jsonb not null,
  result jsonb,
  result_digest text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  leased_at timestamptz,
  lease_until timestamptz,
  completed_at timestamptz,
  unique (connector_id, nonce)
);

create index if not exists agentproof_connector_jobs_claim_idx
  on public.agentproof_connector_jobs (connector_id, status, created_at)
  where status in ('queued', 'leased');

create index if not exists agentproof_connector_jobs_expiry_idx
  on public.agentproof_connector_jobs (expires_at)
  where status in ('queued', 'leased');

alter table public.agentproof_admin_keys enable row level security;
alter table public.agentproof_connectors enable row level security;
alter table public.agentproof_connector_jobs enable row level security;

revoke all on public.agentproof_admin_keys from public, anon, authenticated;
revoke all on public.agentproof_connectors from public, anon, authenticated;
revoke all on public.agentproof_connector_jobs from public, anon, authenticated;

grant select, insert, update, delete on public.agentproof_admin_keys to service_role;
grant select, insert, update, delete on public.agentproof_connectors to service_role;
grant select, insert, update, delete on public.agentproof_connector_jobs to service_role;

insert into public.agentproof_admin_keys (key_hash, label)
values ('3550a09809bb2c369e4c9b2354e891baa1342c5b0580c51e46fd872e39c5f1c3', 'agentproof-vercel-production')
on conflict (key_hash) do nothing;

create or replace function public.agentproof_claim_connector_job(
  p_connector_id uuid,
  p_lease_seconds integer default 90
)
returns setof public.agentproof_connector_jobs
language plpgsql
set search_path = public
as $$
begin
  return query
  with candidate as (
    select job.id
    from public.agentproof_connector_jobs as job
    where job.connector_id = p_connector_id
      and job.expires_at > now()
      and (
        job.status = 'queued'
        or (job.status = 'leased' and job.lease_until < now())
      )
    order by job.created_at
    for update skip locked
    limit 1
  )
  update public.agentproof_connector_jobs as job
  set
    status = 'leased',
    leased_at = now(),
    lease_until = now() + make_interval(secs => greatest(10, least(p_lease_seconds, 300)))
  from candidate
  where job.id = candidate.id
  returning job.*;
end;
$$;

create or replace function public.agentproof_complete_connector_job(
  p_connector_id uuid,
  p_job_id uuid,
  p_nonce uuid,
  p_result jsonb,
  p_result_digest text
)
returns setof public.agentproof_connector_jobs
language plpgsql
set search_path = public
as $$
begin
  return query
  update public.agentproof_connector_jobs as job
  set
    status = 'completed',
    result = p_result,
    result_digest = p_result_digest,
    completed_at = now(),
    lease_until = null
  where job.id = p_job_id
    and job.connector_id = p_connector_id
    and job.nonce = p_nonce
    and job.status = 'leased'
    and job.expires_at > now()
    and job.completed_at is null
  returning job.*;
end;
$$;

revoke all on function public.agentproof_claim_connector_job(uuid, integer) from public, anon, authenticated;
revoke all on function public.agentproof_complete_connector_job(uuid, uuid, uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.agentproof_claim_connector_job(uuid, integer) to service_role;
grant execute on function public.agentproof_complete_connector_job(uuid, uuid, uuid, jsonb, text) to service_role;
