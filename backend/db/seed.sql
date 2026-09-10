-- Seed Head Admin (credentials from env vars — run via psql with env vars substituted)
-- Usage: Run after schema.sql
-- Requires: psql -v head_admin_email="$HEAD_ADMIN_EMAIL" -v head_admin_password_hash="$HEAD_ADMIN_PASSWORD_HASH"

INSERT INTO head_admins (id, email, password_hash, full_name, is_active)
VALUES (
  uuid_generate_v4(),
  :'head_admin_email',
  :'head_admin_password_hash',
  'Head Administrator',
  true
)
ON CONFLICT (email) DO NOTHING;
