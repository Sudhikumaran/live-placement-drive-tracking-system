#!/usr/bin/env node

/**
 * Server Diagnostic Tool
 * Helps identify 500 errors in the PlacementTracker backend
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 PlacementTracker Server Diagnostic\n');

// Check 1: Environment Variables
console.log('1️⃣  Environment Variables Check:');
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'PORT'];
let allEnvVarsPresent = true;

requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`);
    } else {
        console.log(`   ❌ ${envVar} is MISSING`);
        allEnvVarsPresent = false;
    }
});

if (!allEnvVarsPresent) {
    console.log('\n⚠️  Add missing variables to .env file\n');
}

// Check 2: MongoDB Connection
console.log('\n2️⃣  MongoDB Connection Check:');
try {
    await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
    });
    console.log('   ✅ MongoDB connected successfully');
    await mongoose.disconnect();
} catch (error) {
    console.log('   ❌ MongoDB connection failed');
    console.log(`   Error: ${error.message}`);
}

// Check 3: Dependencies
console.log('\n3️⃣  Required Dependencies Check:');
const dependencies = {
    'express': 'Web framework',
    'mongoose': 'MongoDB ODM',
    'jsonwebtoken': 'JWT authentication',
    'bcryptjs': 'Password hashing',
    'cors': 'CORS middleware',
    'socket.io': 'Real-time communication',
    'dotenv': 'Environment variables',
};

for (const [pkg, description] of Object.entries(dependencies)) {
    try {
        await import(pkg);
        console.log(`   ✅ ${pkg} - ${description}`);
    } catch {
        console.log(`   ❌ ${pkg} - MISSING (${description})`);
    }
}

// Check 4: File Structure
console.log('\n4️⃣  Server File Structure Check:');
import fs from 'fs';
const requiredDirs = [
    'controllers',
    'models',
    'routes',
    'middleware',
    'config',
    'utils',
    'uploads'
];

requiredDirs.forEach(dir => {
    if (fs.existsSync(`./${dir}`)) {
        console.log(`   ✅ ${dir}/ directory exists`);
    } else {
        console.log(`   ❌ ${dir}/ directory MISSING`);
    }
});

// Check 5: Key Files
console.log('\n5️⃣  Key Files Check:');
const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'config/db.js',
    'config/socket.js',
    'middleware/auth.js',
    'middleware/errorHandler.js',
    'models/User.js',
    'models/PlacementDrive.js',
    'models/Application.js',
    'routes/auth.js',
];

requiredFiles.forEach(file => {
    if (fs.existsSync(`./${file}`)) {
        console.log(`   ✅ ${file}`);
    } else {
        console.log(`   ⚠️  ${file} - MISSING`);
    }
});

console.log('\n✨ Diagnostic complete!\n');
console.log('💡 Next Steps:');
console.log('   1. Fix any missing environment variables');
console.log('   2. Ensure MongoDB is running');
console.log('   3. Run: npm install (to install dependencies)');
console.log('   4. Check browser Network tab for exact failing endpoint');
console.log('   5. Check server console for detailed error messages\n');

process.exit(0);
