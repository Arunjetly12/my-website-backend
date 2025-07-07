// send-push.js

const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// === CONFIGURATION ===
const SUPABASE_URL = 'https://icbgbhafcxgtpnlwxvti.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljYmdiaGFmY3hndHBubHd4dnRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTE2NDc3NSwiZXhwIjoyMDY2NzQwNzc1fQ.ggev90CyDXXooUrbMwfFGrwMBLXMUf0PxPMIPSAcyz8';
const VAPID_PUBLIC_KEY = 'BPoRHtBVfefKVFTLW7cs8NFezpRkHw__mw_Tr0ci6MGzcGl7QZRC1QtIxrPeEGpqMHH5pcrhF6tKUqAHyFG-aMs';
const VAPID_PRIVATE_KEY = 'bZ1OZ9qXHQjexc9xi2yQdFMYoollsYSEBoTz3rLvnMM';

// === SETUP ===
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

webpush.setVapidDetails(
  'mailto:your@email.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// === MAIN FUNCTION ===
async function sendPushToAll() {
  // 1. Fetch all subscriptions
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription');

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }

  // 2. Send notification to each subscription
  const payload = JSON.stringify({
    title: 'VersaPDF Update!',
    body: '🚀 This is a test notification from your PWA backend!',
  });

  for (const row of data) {
    try {
      await webpush.sendNotification(row.subscription, payload);
      console.log('Notification sent!');
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }
}

sendPushToAll();