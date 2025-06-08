import { initializeAppSettings } from '../src/lib/auth';

async function initDatabase() {
  try {
    console.log('Initializing database...');
    await initializeAppSettings();
    console.log('✅ Database initialized successfully!');
    console.log('📋 Access codes:');
    console.log('   👤 Member: ', process.env.MEMBER_ACCESS_CODE);
    console.log('   🔐 Admin: ', process.env.ADMIN_ACCESS_CODE);
    console.log('🚀 You can now start the application with: npm run dev');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

initDatabase();