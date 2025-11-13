// src/queue/workerPool.js
import { spawn } from 'child_process';
import * as storage from './storage.js';
import defaultCfg from './config.js';

let shouldStop = false;

// run shell command and return { code, stdout, stderr }
function runCommand(cmd, timeoutSec) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, { shell: true });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => stdout += d.toString());
    proc.stderr.on('data', d => stderr += d.toString());

    let timedOut = false;
    let to = null;
    if (timeoutSec && timeoutSec > 0) {
      to = setTimeout(() => {
        timedOut = true;
        try { proc.kill('SIGKILL'); } catch (e) { /* ignore */ }
      }, timeoutSec * 1000);
    }

    proc.on('close', (code) => {
      if (to) clearTimeout(to);
      if (timedOut) {
        resolve({ code: -1, stdout, stderr: `timeout after ${timeoutSec}s` });
      } else {
        resolve({ code, stdout, stderr });
      }
    });

    proc.on('error', (err) => {
      if (to) clearTimeout(to);
      resolve({ code: -1, stdout, stderr: String(err) });
    });
  });
}

async function workerLoop(workerId, backoffBase) {
  console.log(`[worker-${workerId}] started`);
  while (!shouldStop) {
    const job = storage.claimJobReady();
    if (!job) {
      // no ready job; sleep short
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    console.log(`[worker-${workerId}] picked job ${job.id} → ${job.command}`);
    const timeoutSec = Number(storage.getConfig('jobTimeoutSeconds') || defaultCfg.jobTimeoutSeconds);
    const { code, stdout, stderr } = await runCommand(job.command, timeoutSec);

    if (code === 0) {
      console.log(`[worker-${workerId}] job ${job.id} completed`);
      storage.markCompleted(job.id);
    } else {
      const errSummary = (stderr || `exit=${code}`).toString().slice(0, 1000);
      console.log(`[worker-${workerId}] job ${job.id} failed: ${errSummary}`);
      storage.markFailedScheduleRetry(job.id, job.attempts, job.max_retries, errSummary, backoffBase);
    }
  }
  console.log(`[worker-${workerId}] stopped`);
}

export async function startWorkers(count = 1, backoffBase = null) {
  shouldStop = false;
  backoffBase = backoffBase || Number(storage.getConfig('backoffBase') || defaultCfg.backoffBase);
  const promises = [];
  for (let i = 0; i < count; i++) promises.push(workerLoop(i + 1, backoffBase));
  // Wait for exit (these loops exit when shouldStop becomes true)
  await Promise.all(promises);
}

export function stopWorkers() {
  shouldStop = true;
}
