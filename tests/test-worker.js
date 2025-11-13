import { execSync } from 'child_process';

console.log(' TEST 2: Worker Processing');
try {
  const cmd = `node src/cli.js worker:start --count 1`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  console.log(output);
  console.log(' Worker processed jobs successfully\n');
} catch (err) {
  console.error('Worker test failed:', err.message);
}
