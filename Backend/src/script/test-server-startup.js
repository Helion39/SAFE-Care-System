require('dotenv').config();
const { connectDB, setupIndexes } = require('../config/database');

async function testServerStartup() {
    try {
        console.log('🧪 Testing server startup...');
        
        // Test database connection
        await connectDB();
        console.log('✅ Database connection successful');
        
        // Test index setup
        await setupIndexes();
        console.log('✅ Database indexes setup successful');
        
        console.log('🎉 Server startup test passed! No index conflicts.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Server startup test failed:', error);
        process.exit(1);
    }
}

testServerStartup();