#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/300150f0d509291fd2a3cb78ede70092cf9605ee06d9a39b832a93a53abd4c53/contract';
import endContract from '../../snapshots/300150f0d509291fd2a3cb78ede70092cf9605ee06d9a39b832a93a53abd4c53/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/806f175091f1b256607149718b07ee2cf794db13368a98dba044ab430a41e611/contract';
import startContract from '../../snapshots/806f175091f1b256607149718b07ee2cf794db13368a98dba044ab430a41e611/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'order',
        column: col('guestAccessTokenHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
