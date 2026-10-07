#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/31be6b402363886b38354b830e631cc3fcb0880156c81777d33092148cec5bb4/contract';
import endContract from '../../snapshots/31be6b402363886b38354b830e631cc3fcb0880156c81777d33092148cec5bb4/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9c32cacdc6ccccbf7c54b40b3eda22452261905365f5cde8823544d3f291ee92/contract';
import startContract from '../../snapshots/9c32cacdc6ccccbf7c54b40b3eda22452261905365f5cde8823544d3f291ee92/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'payment',
        column: col('providerOrderId', 'text', {
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);