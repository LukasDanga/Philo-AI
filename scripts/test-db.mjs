import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking tables...");
  
  // Try fetching questions
  try {
    const { data, error } = await supabase.from('questions').select('*').limit(3);
    if (error) {
      console.error("Error reading 'questions' table:", error);
    } else {
      console.log("'questions' sample:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Failed to read questions:", e);
  }

  // Try fetching quiz_sessions
  try {
    const { data, error } = await supabase.from('quiz_sessions').select('*').limit(3);
    if (error) {
      console.error("Error reading 'quiz_sessions' table:", error);
    } else {
      console.log("'quiz_sessions' sample:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error("Failed to read quiz_sessions:", e);
  }
}

test();
