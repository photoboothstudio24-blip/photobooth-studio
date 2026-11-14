-- Run AFTER 001_init.sql. Switches payments from a gateway to manual bank/e-wallet transfer with proof upload.
alter table public.transactions drop constraint transactions_status_check;
alter table public.transactions add constraint transactions_status_check check (status in ('pending','review','paid','failed','expired','cancelled'));
alter table public.transactions
  add column method text check (method in ('bri','jago','gopay')),
  add column sender_name text,
  add column proof_path text,
  add column proof_at timestamptz,
  add column reject_reason text;
drop index public.one_pending_per_target;
create unique index one_open_per_target on public.transactions (user_id, to_tier) where status in ('pending','review');

-- Admin approval calls this. Idempotent, never downgrades.
create or replace function public.activate_membership(p_order text, p_txn text, p_type text) returns text language plpgsql security definer set search_path = public as $$
declare tx record; cur text;
begin
  update transactions set status = 'paid', paid_at = now(), midtrans_transaction_id = p_txn, payment_type = p_type
   where order_id = p_order and status in ('pending','review','expired') returning * into tx;
  if not found then return 'already_processed'; end if;
  select tier into cur from memberships where user_id = tx.user_id for update;
  if rank_of(tx.to_tier) > rank_of(cur) then
    update memberships set tier = tx.to_tier, updated_at = now() where user_id = tx.user_id;
    insert into membership_events (user_id, from_tier, to_tier, reason, order_id) values (tx.user_id, cur, tx.to_tier, 'purchase', p_order);
    return 'activated';
  end if;
  return 'no_upgrade';
end $$;
revoke all on function public.activate_membership(text,text,text) from public, anon, authenticated;
grant execute on function public.activate_membership(text,text,text) to service_role;

-- Private bucket for payment proofs: images only, 5 MB. Users can add and read only files in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "upload own proof" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "read own proof" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
