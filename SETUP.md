# Setup Guide

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

## Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root with the following values:

   ```
   JWT_SECRET=some_long_random_secret_string
   PORT=8000
   ```

   - `JWT_SECRET` — used to sign authentication tokens. Change this to any random string before using the app.
   - `PORT` — the port the server listens on. Defaults to `8000` if omitted.

   > `.env` is listed in `.gitignore` and will not be committed to version control.

3. **Start the server**

   ```bash
   node server.js
   ```

4. **Open the app** in your browser at [http://localhost:8000](http://localhost:8000)

## First Run

The SQLite database (`resume.db`) is created automatically on the first startup — no separate migration step is needed.

Register an account through the app to get started.

## Gemini AI (optional)

AI-powered suggestions require a Google Gemini API key. After registering and logging in, go to **Settings** in the app and paste your API key there. The key is stored in the local database and is never committed to version control.

You can get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey).
