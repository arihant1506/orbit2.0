
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hyicijswuktqyrbpopgm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aWNpanN3dWt0cXlyYnBvcGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODA1NDksImV4cCI6MjA4NTI1NjU0OX0.F6ij25UoT8MQKcV9gildyHpa8BF1fZsJkgyfkEpfOEI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
