import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  // Support both ts-node (src/*.ts) and compiled runtime (dist/*.js).
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],

  migrations: ['db/migrations/*.ts', 'dist/db/migrations/*.js'],

  // migrations: isProd
  //   ? ['dist/migrations/*.js'] // production
  //   : ['db/migrations/*.ts'], // development

  synchronize: false,
});

export default AppDataSource;