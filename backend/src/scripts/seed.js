import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import Transaction from '../models/Transaction.js';
import { getSeedData } from './seedData.js';

dotenv.config();

const runSeed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await connectDB();

    console.log('[Seed] Clearing existing transactions...');
    await Transaction.deleteMany({});

    const seedItems = getSeedData();
    console.log(`[Seed] Inserting ${seedItems.length} transactions...`);
    const inserted = await Transaction.insertMany(seedItems);

    console.log(`[Seed] Successfully inserted ${inserted.length} sample transactions.`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

runSeed();
