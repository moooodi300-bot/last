INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES 
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', '0500000001@app.com', crypt('adminadmin', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"phone_number":"0500000001"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', '0500000002@app.com', crypt('adminadmin', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"phone_number":"0500000002"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', '0500000003@app.com', crypt('adminadmin', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"phone_number":"0500000003"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', '0500000004@app.com', crypt('adminadmin', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"phone_number":"0500000004"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', '0500000005@app.com', crypt('adminadmin', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"phone_number":"0500000005"}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, id::text, format('{"sub":"%s","email":"%s"}', id, email)::jsonb, 'email', now(), now(), now()
FROM auth.users 
WHERE email IN ('0500000001@app.com', '0500000002@app.com', '0500000003@app.com', '0500000004@app.com', '0500000005@app.com')
ON CONFLICT DO NOTHING;
