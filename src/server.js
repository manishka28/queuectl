import express from 'express';
import * as jobQueue from './queue/jobQueue.js';
import * as storage from './queue/storage.js';

const app = express();
const port = process.env.PORT || 3000;

(async () => {
  await storage.init();

  app.use(express.json());

  // -----------------------
  //Get job status summary
  // -----------------------
  app.get('/status', async (req, res) => {
    try {
      const states = ['pending', 'processing', 'completed', 'dead'];
      const out = {};
      for (const s of states) {
        const jobs = await storage.listJobs(s);
        out[s] = jobs.length;
      }
      res.json({ ok: true, jobs: out });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // -----------------------
  // List all jobs
  // -----------------------
  app.get('/jobs', async (req, res) => {
    try {
      const jobs = await storage.listJobs();
      res.json({ ok: true, jobs });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // -----------------------
  // List DLQ jobs
  // -----------------------
  app.get('/dlq', async (req, res) => {
    try {
      const dlqJobs = await storage.listDLQ();
      res.json({ ok: true, dlq: dlqJobs });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // -----------------------
  // Retry DLQ job
  // -----------------------
  app.post('/dlq/retry/:id', async (req, res) => {
    try {
      const dlqJobs = await storage.listDLQ();
      const job = dlqJobs.find(j => j.id === req.params.id);
      if (!job) return res.status(404).json({ ok: false, error: 'Job not found in DLQ' });

     
      job.state = 'pending';
      job.attempts = 0;
      await storage.enqueueJob(job);
      await storage.db?.run(`DELETE FROM dlq WHERE id = ?`, [job.id]);
      res.json({ ok: true, message: `Job ${job.id} retried successfully` });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // -----------------------
  //  Start the Express server
  // -----------------------
  app.listen(port, () => {
    console.log(`✅ QueueCTL API running at http://localhost:${port}`);
  });
})();
