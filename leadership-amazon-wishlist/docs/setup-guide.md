# Setup Guide

## Prerequisites

The following software must be installed before running the application:

- **Node.js** (v18 or later) - [https://nodejs.org](https://nodejs.org)
- **MongoDB** (v6 or later) - [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Ollama** - [https://ollama.com](https://ollama.com)

Ensure that `node`, `mongod`, and `ollama` are available in your system PATH.

## Installation

1. Open a terminal in the project root directory.
2. Install dependencies:

```
npm install
```

## Configuration

The application is configured through a `.env` file in the project root. The default values are:

| Variable                  | Default                                      | Description                                        |
|---------------------------|----------------------------------------------|----------------------------------------------------|
| `MONGODB_URI`             | `mongodb://localhost:27017/amazon-wishlist`   | MongoDB connection string                          |
| `OLLAMA_URL`              | `http://localhost:11434`                      | Ollama API base URL                                |
| `OLLAMA_MODEL`            | `llama3.2`                                   | Ollama model used for order info extraction         |
| `PORT`                    | `3000`                                       | Port the web server listens on                     |
| `ORDER_CHECK_INTERVAL_MS` | `300000`                                     | Interval in milliseconds between background order status checks (default 5 minutes) |

Edit `.env` to change any of these values before starting the application.

## Starting the Application

### Using the startup script (recommended)

Double-click `start.cmd` or run it from a terminal:

```
start.cmd
```

This script will:

1. Verify Node.js is installed.
2. Run `npm install` if the `node_modules` directory does not exist.
3. Start MongoDB if it is not already running.
4. Start Ollama if it is not already running.
5. Pull the configured Ollama model if it has not been downloaded yet.
6. Start the Node.js server.

All process IDs are saved to a `.pids` file in the project root so that only the processes started by the script are tracked.

Once started, open a browser and navigate to `http://localhost:3000` (or whichever port is configured).

### Starting manually

If you prefer to start each component yourself:

1. Start MongoDB: `mongod`
2. Start Ollama: `ollama serve`
3. Pull a model: `ollama pull llama3.2`
4. Start the server: `npm start`

## Stopping the Application

Run the stop script:

```
stop.cmd
```

This reads the `.pids` file and stops only the processes that were started by `start.cmd`. Processes that were already running before `start.cmd` was executed are left untouched.

## Restarting the Application

Run the restart script:

```
restart.cmd
```

This stops all tracked processes, waits for them to exit, then runs `start.cmd` to bring everything back up.

## Notes

- The `.pids` file is created by `start.cmd` and removed by `stop.cmd`. If the file exists when `start.cmd` is run, it will refuse to start and ask you to run `stop.cmd` first or delete the stale `.pids` file manually.
- The `start.cmd` script launches MongoDB, Ollama, and the Node server in separate windows. The server output will appear in its own terminal window.
- If Ollama fails to pull the configured model, the application will still start. Order info extraction will not function until a model is available.
