import { col, Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

import type { Contract as End } from '../../snapshots/806f175091f1b256607149718b07ee2cf794db13368a98dba044ab430a41e611/contract';
import endContract from '../../snapshots/806f175091f1b256607149718b07ee2cf794db13368a98dba044ab430a41e611/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/b2d1c01fbc4e8b675ba59b0f54cdcd1d7ece085b9a7f42d60e4a8ec3df7f71e5/contract';
import startContract from '../../snapshots/b2d1c01fbc4e8b675ba59b0f54cdcd1d7ece085b9a7f42d60e4a8ec3df7f71e5/contract.json' with { type: 'json' };

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'payment',
        column: col('upiTransactionReference', 'text', {
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'payment',
        column: col('upiReferenceSubmittedAt', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
