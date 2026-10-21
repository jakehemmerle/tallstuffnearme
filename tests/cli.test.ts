import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import pg from 'pg';

const checkout = path.resolve(import.meta.dir, '..');

function runCli(args: string[], environment: NodeJS.ProcessEnv = {}) {
  const result = spawnSync('bash', [path.join(checkout, 'bin/tsnm'), ...args], {
    cwd: checkout,
    env: { ...process.env, ...environment },
    encoding: 'utf8',
    timeout: 5_000,
  });
  expect(result.error).toBeUndefined();
  return result;
}

describe('CLI database write protection', () => {
  test('db:reset refuses production before connecting to the database', () => {
    const result = spawnSync(process.execPath, ['run', 'db:reset'], {
      cwd: checkout,
      env: {
        ...process.env,
        TALLSTUFF_ENV: 'prod',
        DATABASE_URL: 'postgresql://test@localhost/tallshit_test',
      },
      encoding: 'utf8',
      timeout: 5_000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('TALLSTUFF_ENV=dev or test is required.');
  });

  const targets = [
    { TALLSTUFF_ENV: 'prod', DATABASE_URL: 'postgresql://test@localhost/tallshit_test' },
    { TALLSTUFF_ENV: 'staging', DATABASE_URL: 'postgresql://test@localhost/tallshit_test' },
    { TALLSTUFF_ENV: 'test', DATABASE_URL: 'postgresql://test@localhost/tallshit_prod' },
    { TALLSTUFF_ENV: 'test', DATABASE_URL: 'postgresql://test@database.example/tallshit_test' },
    { TALLSTUFF_ENV: 'dev', DATABASE_URL: 'postgresql://test@database.example/tallshit_dev' },
  ];

  for (const target of targets) {
    for (const command of ['seed', 'seed-fixtures']) {
      test(`${command} refuses ${target.TALLSTUFF_ENV} at ${new URL(target.DATABASE_URL).host}${new URL(target.DATABASE_URL).pathname}`, () => {
        const result = runCli([command], target);
        expect(result.status).not.toBe(0);
        expect(result.stderr).toMatch(/required|restricted/);
      });
    }
  }
});

describe('CLI against seeded PostgreSQL', () => {
  test('db-status loads the runtime environment file and honors an explicit database URL', async () => {
    const connection = process.env.DATABASE_URL;
    if (!connection) throw new Error('The test database URL is required.');
    const directory = await mkdtemp(path.join(tmpdir(), 'tsnm-environment-'));
    try {
      const environmentFile = path.join(directory, 'app.env');
      await writeFile(environmentFile, `DATABASE_URL='${connection.replaceAll("'", "'\\''")}'\n`, { mode: 0o600 });
      const loaded = runCli(['db-status'], { DATABASE_URL: '', TSNM_ENV_FILE: environmentFile });
      expect(loaded.status).toBe(0);
      expect(JSON.parse(loaded.stdout)).toMatchObject({
        identity: [{ database: new URL(connection).pathname.slice(1) }],
        faaObjects: 4,
      });

      await writeFile(environmentFile, "DATABASE_URL='postgresql://ignored@127.0.0.1:1/ignored'\n");
      const overridden = runCli(['db-status'], { DATABASE_URL: connection, TSNM_ENV_FILE: environmentFile });
      expect(overridden.status).toBe(0);
      expect(JSON.parse(overridden.stdout)).toEqual(JSON.parse(loaded.stdout));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 12_000);

  test('a missing runtime environment file fails clearly while help remains available', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tsnm-missing-environment-'));
    try {
      const environment = { DATABASE_URL: '', TSNM_ENV_FILE: path.join(directory, 'missing.env') };
      const status = runCli(['db-status'], environment);
      expect(status.status).toBe(2);
      expect(status.stderr).toContain('Cannot read the database environment file specified by TSNM_ENV_FILE.');
      const help = runCli(['help'], environment);
      expect(help.status).toBe(0);
      expect(help.stdout).toContain('Usage: tsnm');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  test('fixture seeding is repeatable and preserves the row count', async () => {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      const before = await pool.query('SELECT count(*)::integer AS count FROM "FAAObject"');
      expect(before.rows[0].count).toBe(4);

      for (let run = 0; run < 2; run++) {
        const result = runCli(['seed-fixtures']);
        expect(result.status).toBe(0);
        expect(result.stdout).toContain('Seeded 4 test records.');
      }

      const after = await pool.query('SELECT count(*)::integer AS count FROM "FAAObject"');
      expect(after.rows).toEqual(before.rows);
    } finally {
      await pool.end();
    }
  }, 12_000);

  test('export writes real GeoJSON and exits without an open database pool', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'tsnm-export-'));
    try {
      const output = path.join(directory, 'objects.geojson');
      const result = runCli(['export', output]);
      expect(result.status).toBe(0);
      expect(JSON.parse(await readFile(output, 'utf8'))).toMatchObject({
        type: 'FeatureCollection',
        features: [{ properties: { OASNumber: 99000003, City: 'LAS VEGAS' } }],
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 7_000);
});
