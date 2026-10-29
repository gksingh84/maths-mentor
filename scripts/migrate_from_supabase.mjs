import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const supabaseUrl = process.env.SUPABASE_URL || 'postgresql://postgres.rifyrvypqdxtdtfbrlva:LiveQuizPass2026!@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';
const targetUrl = process.env.DATABASE_URL;

if (!targetUrl) {
  console.error('❌ Error: DATABASE_URL is not defined in environment variables.');
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: supabaseUrl } } });
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

const models = [
  'admin',
  'superAdmin',
  'teacher',
  'student',
  'quiz',
  'question',
  'option',
  'attempt',
  'answer',
  'worksheetPaper',
  'worksheetSubmission',
  'studyMaterial',
  'chatMessage',
  'calendarEvent',
  'studentAttendance',
  'studentFee',
  'studentScoreRecord',
  'liveClass',
  'liveClassAttendance',
];

function chunk(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

async function migrate() {
  console.log('🚀 Connecting to Supabase and AWS Local Database...');
  console.log(`📡 Source: Supabase PostgreSQL`);
  console.log(`🎯 Target: Local AWS PostgreSQL`);

  let totalMigrated = 0;

  for (const m of models) {
    try {
      const rows = await source[m].findMany();
      if (!rows || rows.length === 0) {
        continue;
      }

      let insertedCount = 0;
      const batches = chunk(rows, 200);

      for (const batch of batches) {
        const res = await target[m].createMany({
          data: batch,
          skipDuplicates: true,
        });
        insertedCount += res.count;
      }

      console.log(`✅ [${m}] Migrated ${insertedCount} new rows (${rows.length} total found)`);
      totalMigrated += insertedCount;
    } catch (err) {
      console.error(`⚠️ [${m}] Error during migration:`, err.message);
    }
  }

  console.log(`\n🎉 Data Migration Complete! Total items restored: ${totalMigrated}`);
  await source.$disconnect();
  await target.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration fatal error:', err);
  process.exit(1);
});
