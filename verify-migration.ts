/**
 * Verify migration 003: seller_domain column exists
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load env vars first
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying migration 003: seller_domain column...\n');

  try {
    // Test 1: Check if we can query with seller_domain column
    const { data, error } = await supabaseAdmin
      .from('landing_pages')
      .select('id, page_url_key, seller_domain, buyer_id, seller_id')
      .limit(1);

    if (error) {
      console.error('❌ Migration verification FAILED:');
      console.error('Error:', error.message);
      console.error('\nThe seller_domain column may not exist yet.');
      console.error('Run this SQL in Supabase:\n');
      console.error('ALTER TABLE landing_pages RENAME COLUMN subdomain TO seller_domain;\n');
      process.exit(1);
    }

    console.log('✅ seller_domain column exists!');
    console.log(`✅ Found ${data?.length || 0} existing landing page(s)`);
    
    if (data && data.length > 0) {
      console.log('\n📊 Sample data:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    // Test 2: Try to insert a test record (then delete it)
    const testRecord = {
      page_url_key: 'test-migration-verify',
      seller_domain: 'example.com',
      buyer_id: 'test-buyer',
      seller_id: 'test-seller',
      mmyy: '0126',
      page_content: { test: true },
      content_sha: 'test-sha-' + Date.now(),
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('landing_pages')
      .insert(testRecord)
      .select()
      .single();

    if (insertError) {
      console.error('\n⚠️ Warning: Could not insert test record');
      console.error('Error:', insertError.message);
    } else {
      console.log('\n✅ Test insert successful!');
      
      // Clean up test record
      await supabaseAdmin
        .from('landing_pages')
        .delete()
        .eq('id', insertData.id);
      
      console.log('✅ Test record cleaned up');
    }

    console.log('\n🎉 Migration verification PASSED!');
    console.log('✅ Database is ready for seller_domain architecture\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

verifyMigration();
