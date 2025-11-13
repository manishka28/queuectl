## System Overview
QueueCTL is a modular job queue management system built using Node.js, Express, and SQLite.
It supports both CLI-based control and REST API endpoints for monitoring and managing jobs.

Folder Architecture
```bash
queuectl/
├── src/
│   ├── cli.js
│   ├── server.js
│   ├── viewDb.js
│   ├── queue/
|   |   ├── config.js
|   |   ├── workerPool.js
│   |   ├── jobQueue.js
│   |   └── storage.js
│   └── utils/
│       └── logger.js
├── tests/
│   └── test-dlq.js ....
├── queuectl.db
├── README.md
├── DESIGN.md
├── package.json
├── screenshots/
│   ├── 1-view-db.png
│   ├── 2-enqueue.png
│   ├── 3-worker.png
│   ....

```

| Component                     | File                    | Responsibility                                                                                      |
| ----------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| **CLI Interface**             | `src/cli.js`            | Command-line interface using `commander`. Supports enqueuing, status checking, and running workers. |
| **Job Queue Logic**           | `src/queue/jobQueue.js` | Handles job processing, retry logic, and DLQ (Dead Letter Queue) management.                        |
| **Persistent Storage**        | `src/queue/storage.js`  | Manages SQLite database operations for jobs and DLQ.                                                |
| **REST API**                  | `src/server.js`         | Express server exposing endpoints for viewing job stats and retrying DLQ jobs.                      |
| **Database Viewer (Utility)** | `src/viewDb.js`         | Displays the current job and DLQ tables directly from SQLite for quick inspection.                  |


## Job Lifecycle
1. Enqueue: A job is added using the CLI command. It’s stored in the jobs table with state = "pending".
2. Worker Processing : Worker picks up "pending" jobs and executes their command using child_process.execSync().
3. Completion/Failure: On success → state = "completed". On failure → retries until max_retries, then moves to DLQ.
4. DLQ(Dead Letter Queue) : Failed jobs beyond retry limit are stored in the dlq table.
5. Monitoring: API (/status, /jobs, /dlq) or CLI (status, viewDb.js) are used to monitor system state.

