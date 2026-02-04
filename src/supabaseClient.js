// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://llqivnpqeiqplrrdttxt.supabase.co'
// Using the publishable key you provided
const supabaseKey = 'sb_publishable__43AjhHmQ-yMMCFfPMM1Mg_sL2iOCB2'

export const supabase = createClient(supabaseUrl, supabaseKey)