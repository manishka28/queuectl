import * as storage from './storage.js';

export async function processJob(workerId) {
  const pendingJobs = await storage.listJobs('pending');
  if (pendingJobs.length === 0) {
    console.log('No pending jobs');
    return null;
  }

  const job = pendingJobs[0];
  await storage.updateJobState(job.id, 'processing', job.attempts);
  console.log(` Worker ${workerId} picked up job ${job.id}`);

  try {
    const { execSync } = await import('child_process');
    execSync(job.command, { stdio: 'inherit' });
    await storage.updateJobState(job.id, 'completed', job.attempts);
    console.log(` Job ${job.id} completed successfully`);
  } catch (err) {
    job.attempts += 1;
    if (job.attempts >= job.max_retries) {
      await storage.moveToDLQ(job);
      console.log(`Job {job.id} failed and moved to DLQ`);
    } else {
      await storage.updateJobState(job.id, 'pending', job.attempts);
      console.log(`Job ${job.id} failed (retry ${job.attempts}/${job.max_retries})`);
    }
  }
}
