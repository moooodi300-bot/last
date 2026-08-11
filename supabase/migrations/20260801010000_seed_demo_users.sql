CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  names text[] := ARRAY['أحمد', 'وفاء', 'هاني', 'عبدالرحمن', 'إياد'];
  emails text[] := ARRAY['0500000001@demo.com', '0500000002@demo.com', '0500000003@demo.com', '0500000004@demo.com', '0500000005@demo.com'];
  phones text[] := ARRAY['0500000001', '0500000002', '0500000003', '0500000004', '0500000005'];
  i integer;
  uid uuid;
BEGIN
  FOR i IN 1..5 LOOP
    SELECT id INTO uid FROM auth.users WHERE email = emails[i];
    
    IF uid IS NULL THEN
      uid := gen_random_uuid();
      
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', emails[i],
        crypt('adminadmin', gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}',
        json_build_object('phone_number', phones[i], 'full_name', names[i], 'company_name', 'مغسلة ' || names[i]),
        now(), now()
      );
    ELSE
      -- Update password to ensure it's adminadmin
      UPDATE auth.users SET encrypted_password = crypt('adminadmin', gen_salt('bf')) WHERE id = uid;
    END IF;
  END LOOP;
END $$;
