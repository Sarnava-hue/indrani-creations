#!/usr/bin/env -S node

import type { Contract as Start } from '../../snapshots/31be6b402363886b38354b830e631cc3fcb0880156c81777d33092148cec5bb4/contract';

import startContract from '../../snapshots/31be6b402363886b38354b830e631cc3fcb0880156c81777d33092148cec5bb4/contract.json' with { type: 'json' };

import type { Contract as End } from '../../snapshots/b2d1c01fbc4e8b675ba59b0f54cdcd1d7ece085b9a7f42d60e4a8ec3df7f71e5/contract';

import endContract from '../../snapshots/b2d1c01fbc4e8b675ba59b0f54cdcd1d7ece085b9a7f42d60e4a8ec3df7f71e5/contract.json' with { type: 'json' };

import {
  Migration,
  MigrationCLI,
  col,
  fn,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'paymentEvent',

        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),

          col('eventId', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),

          col('eventType', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),

          col('id', 'SERIAL', {
            notNull: true,
            codecRef: { codecId: 'pg/int4@1' },
          }),

          col('payload', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),

          col('paymentId', 'int4', {
            codecRef: { codecId: 'pg/int4@1' },
          }),

          col('provider', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],

        constraints: [primaryKey(['id'])],
      }),

      this.addUnique({
        schema: 'public',
        table: 'paymentEvent',
        constraint: 'paymentEvent_provider_eventId_key',
        columns: ['provider', 'eventId'],
      }),

      this.createIndex({
        schema: 'public',
        table: 'paymentEvent',
        index: 'paymentEvent_eventType_idx_e4cf7742',
        columns: ['eventType'],
      }),

      this.createIndex({
        schema: 'public',
        table: 'paymentEvent',
        index: 'paymentEvent_paymentId_idx_b2fe9a10',
        columns: ['paymentId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);