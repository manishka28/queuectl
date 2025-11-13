import { Command } from 'commander';
import * as storage from './queue/storage.js';
import * as jobQueue from './queue/jobQueue.js';
import { log } from './utils/logger.js';

const program = new Command();

(async () => {
  await storage.init();

  // Enqueue a new job
  program
    .command('enqueue <jobJson>')
    .description('Add a new job to the queue')
    .action(async (jobJson) => {
      try {
        const job = JSON.parse(jobJson);
        job.state = 'pending';
        job.attempts = 0;
        job.max_retries = 3;
        job.created_at = new Date().toISOString();
        job.updated_at = new Date().toISOString();

        await storage.enqueueJob(job);
        log(`✅ Enqueued job ${job.id}`);
      } catch (err) {
        log(`❌ Invalid job JSON: ${err.message}`);
      }
    });

  // Process jobs manually (like a one-time worker)
  program
    .command('worker:start')
    .option('--count <count>', 'Number of workers', '1')
    .option('--interval <ms>', 'Polling interval (default 3000)', '3000')
    .description('Start worker(s) to continuously process jobs')
    .action(async (options) => {
      const count = parseInt(options.count);
      const interval = parseInt(options.interval);

      log(`🚀 Starting ${count} worker(s), polling every ${interval / 1000}s...`);

      for (let i = 0; i < count; i++) {
        setInterval(async () => {
          const pendingJobs = await storage.listJobs('pending');
          if (pendingJobs.length === 0) return;

          const job = pendingJobs[0];
          log(`👷 Worker ${i + 1} picked job ${job.id}`);

          try {
            const { execSync } = await import('child_process');
            execSync(job.command, { stdio: 'inherit' });
            await storage.updateJobState(job.id, 'completed', job.attempts + 1);
            log(`✅ Job ${job.id} completed successfully`);
          } catch (err) {
            await storage.updateJobState(job.id, 'dead', job.attempts + 1);
            log(`❌ Job ${job.id} failed: ${err.message}`);
          }
        }, interval);
      }
    });

  // Check current job status
  program
    .command('status')
    .description('Show job status summary')
    .action(async () => {
      const states = ['pending', 'processing', 'completed', 'dead'];
      log('📊 Queue Status Overview:');
      for (const s of states) {
        const jobs = await storage.listJobs(s);
        log(`${s}: ${jobs.length}`);
      }
    });

  await program.parseAsync(process.argv);
})();
