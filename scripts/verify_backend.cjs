const fs = require('fs');
const path = require('path');

// Read .env manually
function parseEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv();
const url = (process.argv[2] || env.VITE_SUPABASE_URL || '').trim();
const key = (process.argv[3] || env.VITE_SUPABASE_ANON_KEY || '').trim();

console.log('========================================================================');
console.log('           AEROVIS SUPABASE BACKEND CONNECTIVITY & VERIFICATION         ');
console.log('========================================================================');
console.log('Target VITE_SUPABASE_URL     :', url ? (url.length > 40 ? url.substring(0, 40) + '...' : url) : '(empty)');
console.log('Target VITE_SUPABASE_ANON_KEY :', key ? (key.length > 40 ? key.substring(0, 40) + '...' : key) : '(empty)');

console.log('\n--- 1. CREDENTIALS VERIFICATION ---');
const isUrlValid = url.startsWith('http://') || url.startsWith('https://');
const isPlaceholder = url.includes('your-project-ref');

if (!isUrlValid) {
  console.log('❌ FAIL: VITE_SUPABASE_URL is not a valid HTTP/HTTPS URL.');
  if (url.startsWith('sb_publishable_')) {
    console.log('⚠️  DIAGNOSTIC: VITE_SUPABASE_URL contains a publishable key, not a URL.');
  }
} else if (isPlaceholder) {
  console.log('⚠️  AWAITING PROJECT URL: VITE_SUPABASE_URL contains placeholder "your-project-ref".');
} else {
  console.log('✅ PASS: VITE_SUPABASE_URL is configured: ' + url);
}

if (key.startsWith('sb_secret_')) {
  console.log('⚠️  SECURITY ISSUE: Secret key detected in client config. Replace with publishable key.');
} else if (key.startsWith('sb_publishable_')) {
  console.log('✅ PASS: VITE_SUPABASE_ANON_KEY is a publishable client key (sb_publishable_...).');
} else if (key.startsWith('eyJ')) {
  console.log('✅ PASS: VITE_SUPABASE_ANON_KEY is a standard JWT anon key.');
} else {
  console.log('❌ FAIL: VITE_SUPABASE_ANON_KEY is missing or invalid.');
}

async function run() {
  if (!isUrlValid || isPlaceholder) {
    console.log('\n------------------------------------------------------------------------');
    console.log('STATUS: Awaiting live Supabase Project URL from user.');
    console.log('Format needed: https://<project-ref>.supabase.co');
    console.log('Once provided, run:');
    console.log('  node scripts/verify_backend.cjs https://<project-ref>.supabase.co');
    console.log('------------------------------------------------------------------------');
    process.exit(0);
    return;
  }

  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (url, opts) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timeout));
      }
    }
  });

  console.log('\n--- 2. DATABASE SELECT ACCESS TEST (ALL 12 CORE TABLES) ---');
  const tables = [
    'cameras',
    'buses',
    'incidents',
    'incident_notes',
    'detections',
    'vehicle_records',
    'person_records',
    'missing_persons',
    'alerts',
    'traffic_analytics',
    'audit_logs',
    'roles'
  ];

  for (const t of tables) {
    try {
      const { data, count, error } = await client.from(t).select('*', { count: 'exact' }).limit(3);
      if (error) {
        console.log(`❌ Table [${t}]: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✅ Table [${t}]: Accessible (${count ?? data?.length ?? 0} rows found)`);
      }
    } catch (e) {
      console.log(`❌ Table [${t}]: Exception - ${e.message}`);
    }
  }

  console.log('\n--- 3. AUTHENTICATION SERVICE ---');
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.log(`❌ Auth check failed: ${error.message}`);
    } else {
      console.log(`✅ Auth service responsive. Initial session: ${data.session ? 'Active' : 'Guest/Anonymous mode ready'}`);
    }
  } catch (e) {
    console.log(`❌ Auth exception: ${e.message}`);
  }

  process.exit(0);
}

run();
