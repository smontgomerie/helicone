-- Ensure proxy keys can only reference provider keys from the same organization.
-- Existing data should be audited before this constraint is validated.
ALTER TABLE public.provider_keys
  ADD CONSTRAINT provider_keys_id_org_id_unique UNIQUE (id, org_id);

ALTER TABLE public.helicone_proxy_keys
  ADD CONSTRAINT helicone_proxy_keys_provider_key_same_org_fk
  FOREIGN KEY (provider_key_id, org_id)
  REFERENCES public.provider_keys (id, org_id)
  NOT VALID;
