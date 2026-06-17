import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://vlyfagjqdezzupvpljkh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZseWZhZ2pxZGV6enVwdnBsamtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNjc4NjYsImV4cCI6MjA5NDk0Mzg2Nn0.YWmrc04UIdoOn917pjCFdn2PhMSG5jWLfRAfpDhR8kQ');

async function test() {
  const { data, error } = await supabase.from('residents').select('id, firstname, lastname, barangay_id').order('created_at', { ascending: false }).limit(20);
  console.log('Recent residents:', data);
}

test();
