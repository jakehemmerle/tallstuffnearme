export function requireDevelopmentDatabase(testOnly = false) {
  const environment = process.env.TALLSTUFF_ENV;
  if (environment !== 'test' && (testOnly || environment !== 'dev')) {
    throw new Error(testOnly ? 'TALLSTUFF_ENV=test is required.' : 'TALLSTUFF_ENV=dev or test is required.');
  }
  const connection = new URL(process.env.DATABASE_URL ?? '');
  const allowedNames = testOnly ? ['/tallshit_test'] : ['/tallshit_dev', '/tallshit_test'];
  if (!['localhost', '127.0.0.1', '[::1]'].includes(connection.hostname)
      || !allowedNames.includes(connection.pathname)) {
    throw new Error('Database writes are restricted to a local tallshit_dev or tallshit_test database.');
  }
}
