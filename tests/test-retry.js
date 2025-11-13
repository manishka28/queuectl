import { execSync } from 'child_process';

console.log('TEST 3: Retry and DLQ');
try {

  const enqueueFailJob = `node src/cli.js enqueue "{\\"id\\":\\"job_fail_1\\",\\"command\\":\\"invalidcommand\\"}"`;
  console.log(execSync(enqueueFailJob, { encoding: 'utf-8' }));

  const workerRun = `node src/cli.js worker:start --count 1`;
  console.log(execSync(workerRun, { encoding: 'utf-8' }));

  const checkDLQ = `node src/cli.js status`;
  console.log(execSync(checkDLQ, { encoding: 'utf-8' }));

  console.log('Retry/DLQ test completed\n');
} catch (err) {
  console.error('Retry test failed:', err.message);
}
