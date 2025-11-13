// src/cli.js
import { Command } from 'commander';
import * as storage from './queue/storage.js';
import * as jobQueue from './queue/jobQueue.js';

const program = new Command();

(async () => {
  await storage.init(); // ✅ Ensure DB is ready before commands

  program
    .command('enqueue <jobJson>')
    .description('Add a new job to the queue')
    .action(async (jobJson) => {
      try {
        const job = JSON.parse(jobJson);
        // Add default values if missing
        job.state = 'pending';
        job.attempts = 0;
        job.max_retries = 3;
        job.created_at = new Date().toISOString();
        job.updated_at = new Date().toISOString();
        await storage.enqueueJob(job);
        console.log(`✅ Enqueued ${job.id}`);
      } catch (err) {
        console.error('Invalid job JSON:', err.message);
      }
    });

  program
    .command('worker:start')
    .option('--count <count>', 'Number of workers', '1')
    .description('Start worker(s) to process jobs')
    .action(async (options) => {
      const count = parseInt(options.count);
      for (let i = 0; i < count; i++) {
        await jobQueue.processJob(i + 1);
      }
    });

  program
    .command('status')
    .description('Show job status summary')
    .action(async () => {
      const states = ['pending', 'processing', 'completed', 'dead'];
      console.log('📊 Queue Status:');
      for (const s of states) {
        const jobs = await storage.listJobs(s);
        console.log(`${s}: ${jobs.length}`);
      }
    });

  await program.parseAsync(process.argv);
})();
