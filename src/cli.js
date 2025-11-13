#!/usr/bin/env node
// src/cli.js
import { Command } from 'commander';
import * as storage from './queue/storage.js';
import * as jobQueue from './queue/jobQueue.js';
import * as workerPool from './queue/workerPool.js';

const program = new Command();
storage.init();

program.name('queuectl').description('QueueCTL — CLI job queue').version('0.1.0');

program
  .command('enqueue')
  .argument('<jobJson>')
  .description('Enqueue job: e.g. \'{"id":"job1","command":"echo hi"}\'')
  .action((jobJson) => {
    try {
      const job = JSON.parse(jobJson);
      jobQueue.enqueue(job);
      console.log('Enqueued', job.id);
    } catch (e) {
      console.error('Invalid job JSON:', e.message);
    }
  });

program
  .command('worker:start')
  .option('--count <n>', 'number of workers', (v) => parseInt(v, 10), 1)
  .option('--background', 'run in background (use pm2 recommended)', false)
  .description('Start worker(s)')
  .action(async (opts) => {
    const count = opts.count || 1;
    if (opts.background) {
      console.log('Background flag set — recommended to use pm2 or systemd. Example:');
      console.log('  pm2 start src/cli.js --name queuectl -- worker:start -- --count', count);
      return;
    }

    // Graceful shutdown handlers
    process.on('SIGINT', () => {
      console.log('SIGINT received — stopping workers...');
      workerPool.stopWorkers();
    });
    process.on('SIGTERM', () => {
      console.log('SIGTERM received — stopping workers...');
      workerPool.stopWorkers();
    });

    console.log(`Starting ${count} worker(s) in foreground (pid=${process.pid})`);
    await workerPool.startWorkers(count);
    console.log('All workers exited');
  });

program
  .command('status')
  .description('Show counts by state')
  .action(() => {
    const states = ['pending', 'processing', 'completed', 'dead'];
    const out = {};
    for (const s of states) out[s] = jobQueue.list(s).length;
    console.log(JSON.stringify({ jobs: out }, null, 2));
  });

program
  .command('list')
  .option('--state <state>', 'filter by state')
  .description('List jobs (optionally filter by state)')
  .action((opts) => {
    console.log(JSON.stringify(jobQueue.list(opts.state), null, 2));
  });

program
  .command('dlq:list')
  .description('List DLQ (dead) jobs')
  .action(() => {
    console.log(JSON.stringify(jobQueue.dlqList(), null, 2));
  });

program
  .command('dlq:retry')
  .argument('<jobId>')
  .description('Retry a job from DLQ (move it back to pending)')
  .action((id) => {
    try {
      jobQueue.dlqRetry(id);
      console.log('Moved to pending:', id);
    } catch (e) {
      console.error('Error:', e.message);
    }
  });

program
  .command('config:set')
  .argument('<key>')
  .argument('<value>')
  .description('Set config key (backoffBase, defaultMaxRetries, jobTimeoutSeconds)')
  .action((key, value) => {
    storage.setConfig(key, value);
    console.log('set', key, value);
  });

program
  .command('config:get')
  .argument('<key>')
  .action((key) => {
    console.log(key, '=', storage.getConfig(key));
  });

program.parse(process.argv);
