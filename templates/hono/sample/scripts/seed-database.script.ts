import { readdir } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const seedDirectory = join(__dirname, '../prisma/seeds');

readdir(seedDirectory, (err, files) => {
  if (err) {
    console.error('Error reading seed directory:', err);
    return;
  }

  files.forEach((file) => {
    if (file === 'seed-all.ts') return;
    if (extname(file) === '.ts') {
      try {
        execSync(`ts-node ${join(seedDirectory, file)}`, {
          stdio: 'inherit',
        });
        console.log(`Successfully ran ${file}`);
      } catch (error) {
        console.error(`Error running ${file}:`, error);
      }
    }
  });
});
