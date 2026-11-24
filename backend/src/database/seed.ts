import { seedDemoData } from './seedDemo';

// Delegated entrypoint for seeding demo data in development / test environments
export async function seedDatabase() {
  await seedDemoData();
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database demo seed complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
