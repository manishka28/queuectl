// src/queue/jobQueue.js
import * as storage from './storage.js';

export function enqueue(job) {
  if (!job || !job.id || !job.command) {
    throw new Error('job must include id and command');
  }
  storage.enqueueJob(job);
}

export function list(state = null) {
  return storage.listJobs(state);
}

export function dlqList() {
  return storage.listJobs('dead');
}

export function dlqRetry(id) {
  storage.retryDLQ(id);
}
