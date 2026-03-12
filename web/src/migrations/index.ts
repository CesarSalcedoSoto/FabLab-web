import * as migration_20260224_225719_init from './20260224_225719_init';

export const migrations = [
  {
    up: migration_20260224_225719_init.up,
    down: migration_20260224_225719_init.down,
    name: '20260224_225719_init'
  },
];
