import { execSync } from 'child_process';

const tests = [
  'test-enqueue.js',
  'test-worker.js',
  'test-retry.js',
  'test-dlq.js',
  'test-status.js'
];

for (const file of tests) {
  console.log(`\nRunning ${file}...\n`);
  try {
    const output = execSync(`node tests/${file}`, { encoding: 'utf-8' });
    console.log(output);
  } catch (err) {
    console.error(`${file} failed:\n`, err.stdout || err.message);
  }
}
