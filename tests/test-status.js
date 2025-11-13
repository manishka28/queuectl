import { execSync } from 'child_process';

console.log(' TEST 5: Queue Status');
try {
  const cmd = `node src/cli.js status`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  console.log(output);
  console.log(' Status test completed\n');
} catch (err) {
  console.error(' Status test failed:', err.message);
}
