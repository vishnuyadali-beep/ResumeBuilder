// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// server.js — Application entry point
//
// Starts the Express server, loads middleware, serves static files,
// and mounts all API route modules under /api/.
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config()
const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')

const intPort = process.env.PORT || 8000

// AI: creates the Express app and attaches JSON body parsing and cookie parsing middleware
const app = express()
app.use(express.json())
app.use(cookieParser())

// AI: serves everything in public/ as static files (HTML pages, CSS, frontend JS)
app.use(express.static(path.join(__dirname, 'public')))

// AI: serves Bootstrap's CSS and JS directly from node_modules — no CDN required
app.use('/lib/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')))

// AI: mounts each API module — all data routes live under /api/
app.use('/api/users',          require('./api/users'))          // register + profile
app.use('/api/sessions',       require('./api/sessions'))       // login + logout
app.use('/api/jobs',           require('./api/jobs'))           // work experience
app.use('/api/skills',         require('./api/skills'))         // skills
app.use('/api/certifications', require('./api/certifications')) // certifications
app.use('/api/awards',         require('./api/awards'))         // awards
app.use('/api/targetjobs',     require('./api/targetjobs'))     // saved job postings
app.use('/api/ai',             require('./api/ai'))             // Gemini AI features

// AI: starts the HTTP server on the configured port
app.listen(intPort, () => {
    console.log('Listening on', intPort)
})
