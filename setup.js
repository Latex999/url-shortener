const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

// Generate a random string for session secret
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Check if MongoDB is installed locally
function isMongoDBInstalled() {
  try {
    const output = execSync('mongod --version', { stdio: 'pipe' }).toString();
    return output.includes('db version');
  } catch (error) {
    return false;
  }
}

// Main setup function
async function setup() {
  console.log('🚀 URL Shortener Setup Wizard');
  console.log('============================');
  console.log('This wizard will help you set up your URL shortener application.\n');
  
  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('An .env file already exists. Do you want to overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Your existing .env file was not modified.');
      rl.close();
      return;
    }
  }
  
  // Start collecting information
  const port = await question('Port number (default: 3000): ') || '3000';
  const nodeEnv = await question('Environment (development/production, default: development): ') || 'development';
  const baseUrl = await question(`Base URL (default for development: http://localhost:${port}): `) || `http://localhost:${port}`;
  
  // MongoDB connection
  console.log('\n--- MongoDB Configuration ---');
  const isMongoLocal = isMongoDBInstalled();
  let mongoUri;
  
  if (isMongoLocal) {
    console.log('Local MongoDB installation detected.');
    const useLocalMongo = await question('Do you want to use your local MongoDB? (y/n): ');
    
    if (useLocalMongo.toLowerCase() === 'y') {
      const dbName = await question('Database name (default: url-shortener): ') || 'url-shortener';
      mongoUri = `mongodb://localhost:27017/${dbName}`;
    } else {
      mongoUri = await question('MongoDB URI (e.g., mongodb+srv://...): ');
    }
  } else {
    console.log('No local MongoDB installation detected.');
    console.log('You can use MongoDB Atlas (https://www.mongodb.com/cloud/atlas) for a free cloud database.');
    mongoUri = await question('MongoDB URI (e.g., mongodb+srv://...): ');
  }
  
  if (!mongoUri) {
    console.log('MongoDB URI is required. Setup cancelled.');
    rl.close();
    return;
  }
  
  // Admin user
  console.log('\n--- Admin User Configuration ---');
  const adminEmail = await question('Admin email (default: admin@example.com): ') || 'admin@example.com';
  const adminPassword = await question('Admin password (default: adminpassword123): ') || 'adminpassword123';
  
  // Rate limiting
  const rateLimit = await question('Rate limit (requests per 15 min window, default: 100): ') || '100';
  
  // Generate session secret
  const sessionSecret = generateRandomString();
  
  // Prepare .env content
  const envContent = `# Application Configuration
PORT=${port}
NODE_ENV=${nodeEnv}
BASE_URL=${baseUrl}

# MongoDB Connection
MONGODB_URI=${mongoUri}

# Session Secret
SESSION_SECRET=${sessionSecret}

# Admin User Setup
ADMIN_EMAIL=${adminEmail}
ADMIN_PASSWORD=${adminPassword}

# Rate Limiting
RATE_LIMIT=${rateLimit}
`;

  // Write to .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file created successfully!');
  
  // Install dependencies if needed
  console.log('\nWould you like to install dependencies now? (This will run npm install)');
  const installDeps = await question('Install dependencies? (y/n): ');
  
  if (installDeps.toLowerCase() === 'y') {
    console.log('\nInstalling dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully!');
    } catch (error) {
      console.error('❌ Error installing dependencies:', error.message);
    }
  }
  
  console.log('\n🎉 Setup completed successfully!');
  console.log(`\nTo start the application, run:`);
  console.log(`  npm start`);
  console.log(`\nFor development with auto-restart:`);
  console.log(`  npm run dev`);
  console.log(`\nYour URL shortener will be available at: ${baseUrl}`);
  
  rl.close();
}

// Run setup
setup().catch(err => {
  console.error('Setup error:', err);
  rl.close();
});