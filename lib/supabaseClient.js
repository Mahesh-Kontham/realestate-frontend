import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rsqvusfanywhzqryzqck.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzcXZ1c2Zhbnl3aHpxcnl6cWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTgwMDQsImV4cCI6MjA3NzIzNDAwNH0.-NsqAPLX1qGEF1ouLqIPI8LpzINdI_P1VkTyag6drMA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
