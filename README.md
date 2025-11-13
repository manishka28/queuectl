# QueueCTL - CLI Based Job Queue System

This project is developed as part of an internship assignment to demonstrate my skills in Node.js, Express.js , SQLite, and CLI-based tool development. 
It showcases understanding of asynchronous programming , modular architecture, database integration and job queue processing with retry and dead-letter handling. 
The assignment includes both CLI functionality and HTTP API for job management & monitoring.


## Overview
QueueCTL is a lightweight Command-Line Interface(CLI) and API-based job queue system built using Node.js and SQLite.
It allows enqueueing shell commands as jobs, executing them using worker processes, tracking their status, and automatically retrying or moving failed jobs to a Dead Letter Queue(DLQ). 


## Features
1. Job Queue Management-Enqueue and process shell commands as jobs.
2. Retry Mechanism — Automatically retries failed jobs up to a defined limit.
3. Dead Letter Queue (DLQ) — Moves permanently failed jobs for inspection and retry.
4. CLI Tool — Fully functional terminal interface for job operations.
5. Express API — REST endpoints for external integrations and monitoring.
6. SQLite Storage — Lightweight local database for persistence.

## Installation and Setup

1. Clone the repository
   ```bash
   git clone https://github.com/manishka28/queuectl.git
   cd queuectl
   ```
2. Install dependencies
   ```bash
   npm install
    ```
3. Start the CLI
   ```bash
   node src/cli.js --help
   ```
   Examples:
   i. Enqueue Jobs
      ```bash
      node src/cli.js enqueue "{\"id\":\"job1\",\"command\":\"echo Hello QueueCTL\"}"
      node src/cli.js enqueue "{\"id\":\"job2\",\"command\":\"echo Processing...\"}"
      ```
   ii. Process Jobs
      ```bash
      node src/cli.js worker:start --count 1
      ```
   iii. Check Status
      ```bash
      node src/cli.js status
      ```
   iv. View DB
      ```bash
       node src/viewDb.js
      ```

   OR
   
5. Run Express Server
   ```bash
   npm run server
   ```
   Visit : http://localhost:3000/status

   # Available API Endpoints:
   | Method | Route | Description |
   |--------|--------|-------------|
   | GET | `/status` | Get job count summary |
   | GET | `/jobs` | List all jobs |
   | GET | `/dlq` | View Dead Letter Queue |
   | POST | `/dlq/retry/:id` | Retry a failed DLQ job |

## Technologies Used
1. Node.js
2. Express.js
3. SQLite
4. Commander.js (CLI Framework)

[Demo Video](https://drive.google.com/file/d/1PbHaqAcMuqFLZsKse_ZJr8msq2bBVR2e/view?usp=sharing)

## Author
Manishka Gupta

   





