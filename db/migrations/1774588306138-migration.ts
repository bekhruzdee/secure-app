import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1774588306138 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "users" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "username" varchar NOT NULL, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now())`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e41" ON "users" ("username")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_fe0bb3f6520ee0469504521e41"`
        );
        await queryRunner.query(
            `DROP TABLE IF EXISTS "users"`
        );
    }

}
