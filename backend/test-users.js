// Test script to check if there are users in the database
import { User } from './models/user.model.js';
import './db/index.js';

async function testUsers() {
    try {
        const users = await User.find().limit(5).select('_id username name');
        console.log('Sample users:', users);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testUsers();
