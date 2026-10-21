import { requireDevelopmentDatabase } from './development-database';

requireDevelopmentDatabase();
const result = Bun.spawnSync(['bunx', '--no-install', '--bun', 'prisma', 'migrate', 'reset', '--force'], {
  stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
});
process.exit(result.exitCode);
