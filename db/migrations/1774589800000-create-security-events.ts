import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSecurityEvents1774589800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "security_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" varchar(50) NOT NULL,
        "ip" varchar(15),
        "path" varchar(500) NOT NULL,
        "method" varchar(10) NOT NULL,
        "user_agent" varchar(500),
        "reason" varchar(1000),
        "payload_snippet" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_security_events_type_created_at" ON "security_events" ("type", "created_at")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_security_events_type_created_at"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "security_events"`);
  }
}
