INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, id::text, format('{"sub":"%s","email":"%s"}', id, email)::jsonb, 'email', now(), now(), now()
FROM auth.users 
WHERE email IN ('0500000001@app.com', '0500000002@app.com', '0500000003@app.com', '0500000004@app.com', '0500000005@app.com')
ON CONFLICT DO NOTHING;

UPDATE auth.users SET encrypted_password = crypt('adminadmin', gen_salt('bf'))
WHERE email IN ('0500000001@app.com', '0500000002@app.com', '0500000003@app.com', '0500000004@app.com', '0500000005@app.com');
