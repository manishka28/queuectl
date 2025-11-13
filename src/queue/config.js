// src/queue/config.js
export default {
  backoffBase: 2,
  defaultMaxRetries: 3,
  workerCount: 1,
  jobTimeoutSeconds: 60,
  dbPath: process.env.QUEUECTL_DB || './queue.db'
};
