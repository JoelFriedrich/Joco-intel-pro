import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sjebzcvgjdorzyvnpnle.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZWJ6Y3ZnamRvcnp5dm5wbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzcxODksImV4cCI6MjA4OTQxMzE4OX0.jlkCs9WcPT187Y-sD4uzxf0WufPLaMzooXHkgHrDOzY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
