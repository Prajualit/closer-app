// scripts/fixUserMedia.ts
// Run this script with: ts-node scripts/fixUserMedia.ts
// This script will safely convert Buffer/string user.media fields to arrays, preserving all data.

import mongoose from 'mongoose';
import { User } from '../backend/models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixUserMedia(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  const users = await User.find();
  let updatedCount = 0;

  for (const user of users) {
    let changed = false;
    let media: any = user.media;
    if (!Array.isArray(media)) {
      if (media && typeof media === 'object' && typeof Buffer !== 'undefined' && Buffer.isBuffer(media)) {
        try {
          const parsed = JSON.parse(media.toString());
          if (Array.isArray(parsed)) {
            user.set('media', parsed);
            changed = true;
          }
        } catch {}
      } else if (typeof media === 'string') {
        try {
          const parsed = JSON.parse(media);
          if (Array.isArray(parsed)) {
            user.set('media', parsed);
            changed = true;
          }
        } catch {}
      }
    }
    if (changed) {
      await user.save();
      updatedCount++;
      console.log(`Fixed media for user: ${user._id}`);
    }
  }
  console.log(`Done. Updated ${updatedCount} users.`);
  await mongoose.disconnect();
}

fixUserMedia().catch(err => {
  console.error('Error fixing user media:', err);
  process.exit(1);
});
