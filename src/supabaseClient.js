// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sbuyvtpayardwonyivpm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidXl2dHBheWFyZHdvbnlpdnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzgyMjEsImV4cCI6MjA4OTQxNDIyMX0.TKpKbeSoQjqgUHAuWiy6BuGZMubm4ATrfPhMk3Sj_oA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)