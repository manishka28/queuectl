import { execSync } from 'child_process';

console.log('TEST 1: Enqueue Job');
try {
  const cmd = `node src/cli.js enqueue "{\\"id\\":\\"job_test_1\\",\\"command\\":\\"echo Hello from Test 1\\"}"`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  console.log(output);
  console.log('Enqueue test passed\n');
} catch (err) {
  console.error('Enqueue test failed:', err.message);
}
