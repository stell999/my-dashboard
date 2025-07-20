import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xubkedbfdldcmlzppybb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1YmtlZGJmZGxkY21senBweWJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTM0MTYsImV4cCI6MjA2NzkyOTQxNn0.sTP9mY9wUXzHDWM4Ksr4gxVzd_NAXsGnxh4haREv0wI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
