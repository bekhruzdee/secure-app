import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

export async function seed(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  const superAdminUsername =
    process.env.SUPERADMIN_USERNAME ?? process.env.SUPER_ADMIN_USERNAME;
  const superAdminPassword =
    process.env.SUPERADMIN_PASSWORD ?? process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminUsername || !superAdminPassword) {
    throw new Error(
      'Missing superadmin seed env vars: SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD',
    );
  }

  const existingSuperAdmin = await userRepo.findOne({
    where: { username: superAdminUsername },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);
    const superAdmin = userRepo.create({
      username: superAdminUsername,
      password: hashedPassword,
      role: Role.ADMIN,
    });
    await userRepo.save(superAdmin);
    console.log('✅ Superadmin created');
  } else {
    console.log('✔ Superadmin already exists');
  }

  const managerUsername = process.env.MANAGER_USERNAME;
  const managerPassword = process.env.MANAGER_PASSWORD;

  if (!managerUsername || !managerPassword) {
    throw new Error(
      'Missing manager seed env vars: MANAGER_USERNAME and MANAGER_PASSWORD',
    );
  }

  const existingManager = await userRepo.findOne({
    where: { username: managerUsername },
  });

  if (!existingManager) {
    const hashedPassword = await bcrypt.hash(managerPassword, 12);
    const manager = userRepo.create({
      username: managerUsername,
      password: hashedPassword,
      role: Role.MANAGER,
    });
    await userRepo.save(manager);
    console.log('✅ Manager created');
  } else {
    console.log('✔ Manager already exists');
  }

  console.log('🚀 Seeder finished successfully');
}
