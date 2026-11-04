alter table public.invoices
  add column if not exists document_type text not null default 'invoice',
  add column if not exists package_title text,
  add column if not exists inclusions text,
  add column if not exists payment_terms text,
  add column if not exists renewal_terms text,
  add column if not exists proposal_note text,
  add column if not exists contact_phone text,
  add column if not exists valid_until date;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_document_type_check'
      and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_document_type_check
      check (document_type in ('invoice','quotation'));
  end if;
end $$;
