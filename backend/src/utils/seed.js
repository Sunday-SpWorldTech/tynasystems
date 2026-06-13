import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import { fallbackProducts } from '../routes/products.js';

async function seed() {
  await connectDB();
  const adminEmail = (process.env.STAFF_EMAIL || process.env.ADMIN_EMAIL || 'staff@tynasystems.com').toLowerCase();
  const staffUsername = process.env.STAFF_USERNAME || 'Tyna';
  const adminPassword = process.env.STAFF_PASSWORD || process.env.ADMIN_PASSWORD || 'Systems';
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await User.create({ name: `${staffUsername} Staff`, email: adminEmail, passwordHash, role: 'staff' });
    console.log(`Staff created: ${adminEmail}`);
  } else {
    console.log(`Staff already exists: ${adminEmail}`);
  }
  for (const item of fallbackProducts) {
    await Product.updateOne({ slug: item.slug }, { $setOnInsert: item }, { upsert: true });
  }
  console.log('Products seeded.');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
