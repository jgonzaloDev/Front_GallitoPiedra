import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aescziecnxnleugaelqq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlc2N6aWVjbnhubGV1Z2FlbHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODcxMzAsImV4cCI6MjA5NDg2MzEzMH0.QNDrhm5CW_nKhUV-W37p_oIwk6I1EfKWKXdzAu5jAVk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)