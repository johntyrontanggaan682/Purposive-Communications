// supabase.js
// Supabase Storage connector for task file submissions only.
// Replace SUPABASE_ANON_KEY with your Project Settings > API > anon public key.
// Never place your database password or service_role key in frontend code.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://rmrzvkzzwwsbikovvurk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtcnp2a3p6d3dzYmlrb3Z2dXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNzMxMTUsImV4cCI6MjA5NDY0OTExNX0.1JGXGgyjSYJ7zma-ulKRLXgA1aSP19T4EYECueIRENw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
