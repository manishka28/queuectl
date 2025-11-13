// src/server.js
import express from 'express';
import * as jobQueue from './queue/jobQueue.js';
import * as storage from './queue/storage.js';

const app = express();
const port = process.env.PORT || 3000;

storage.init();

app.get('/status', (req, res) => {
  const states = ['pending', 'processing', 'completed', 'dead'];
  const out = {};
  for (const s of states) out[s] = jobQueue.list(s).length;
  res.json({ jobs: out });
});

app.get('/jobs', (req, res) => {
  res.json(jobQueue.list());
});

app.get('/dlq', (req, res) => {
  res.json(jobQueue.dlqList());
});

app.post('/dlq/retry/:id', (req, res) => {
  try {
    jobQueue.dlqRetry(req.params.id);
    res.json({ ok: true, id: req.params.id });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.listen(port, () => {
  console.log(`QueueCTL API listening at http://localhost:${port}`);
});
