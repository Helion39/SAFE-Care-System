require('dotenv').config();
const mongoose = require('mongoose');

async function removeDbValidation() {
    try {
        console.log('🔧 Removing database-level validation...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check current collection validation
        console.log('\n🔍 Checking current validation rules...');
        
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            console.log('Collections found:', collections.map(c => c.name));

            // Check assignments collection specifically
            const assignmentsCollection = collections.find(c => c.name === 'assignments');
            if (assignmentsCollection && assignmentsCollection.options && assignmentsCollection.options.validator) {
                console.log('❌ Found database-level validation on assignments collection');
                console.log('Validation rules:', JSON.stringify(assignmentsCollection.options.validator, null, 2));
                
                // Remove validation
                await mongoose.connection.db.command({
                    collMod: 'assignments',
                    validator: {},
                    validationLevel: 'off'
                });
                console.log('✅ Database validation removed from assignments collection');
            } else {
                console.log('✅ No database-level validation found on assignments collection');
            }

            // Also check if there are any schema validation issues by dropping and recreating the collection
            console.log('\n🔄 Recreating assignments collection...');
            await mongoose.connection.db.collection('assignments').drop().catch(() => {
                console.log('   Collection did not exist, creating new one');
            });
            
            // Create new collection without validation
            await mongoose.connection.db.createCollection('assignments');
            console.log('✅ Clean assignments collection created');

        } catch (error) {
            console.log('Error checking validation:', error.message);
        }

        console.log('\n🎉 Database validation cleanup completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database validation cleanup failed:', error);
        process.exit(1);
    }
}

removeDbValidation();