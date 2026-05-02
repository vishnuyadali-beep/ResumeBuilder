// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// db/init.js — Database setup and connection
//
// Opens (or creates) resume.db on disk, creates all tables on first run,
// and exports the connection with three async helper methods attached so every
// API file can use async/await instead of raw SQLite callbacks.
// ─────────────────────────────────────────────────────────────────────────────

const sqlite3 = require('sqlite3').verbose()

// AI: opens (or creates) resume.db on disk; exits the process immediately if the connection fails
const db = new sqlite3.Database('resume.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message)
        process.exit(1)
    }
    console.log('Connected to resume.db')
})

// AI: creates all tables on startup; IF NOT EXISTS makes this safe to run on every server start
db.serialize(() => {

    // AI: stores login credentials and profile data for each user
    db.run(`CREATE TABLE IF NOT EXISTS tblUsers (
        UserID      TEXT PRIMARY KEY,
        Email       TEXT UNIQUE NOT NULL,
        Password    TEXT NOT NULL,
        Name        TEXT NOT NULL,
        Phone       TEXT,
        Address     TEXT,
        Summary     TEXT,
        GeminiAPIKey TEXT
    )`)

    // AI: one row per work experience entry, linked to the owning user
    db.run(`CREATE TABLE IF NOT EXISTS tblJobs (
        JobID       TEXT PRIMARY KEY,
        UserID      TEXT NOT NULL,
        Title       TEXT NOT NULL,
        Company     TEXT NOT NULL,
        StartDate   TEXT,
        EndDate     TEXT,
        FOREIGN KEY (UserID) REFERENCES tblUsers(UserID)
    )`)

    // AI: individual responsibility bullet points that belong to a job
    db.run(`CREATE TABLE IF NOT EXISTS tblJobDetails (
        DetailID    TEXT PRIMARY KEY,
        JobID       TEXT NOT NULL,
        Description TEXT NOT NULL,
        FOREIGN KEY (JobID) REFERENCES tblJobs(JobID)
    )`)

    // AI: skills with an optional category label (e.g. "Programming Languages")
    db.run(`CREATE TABLE IF NOT EXISTS tblSkills (
        SkillID     TEXT PRIMARY KEY,
        UserID      TEXT NOT NULL,
        Name        TEXT NOT NULL,
        Category    TEXT,
        FOREIGN KEY (UserID) REFERENCES tblUsers(UserID)
    )`)

    // AI: professional certifications with issuer and year
    db.run(`CREATE TABLE IF NOT EXISTS tblCertifications (
        CertID      TEXT PRIMARY KEY,
        UserID      TEXT NOT NULL,
        Name        TEXT NOT NULL,
        Issuer      TEXT,
        Year        TEXT,
        FOREIGN KEY (UserID) REFERENCES tblUsers(UserID)
    )`)

    // AI: awards and honors with an optional description and year
    db.run(`CREATE TABLE IF NOT EXISTS tblAwards (
        AwardID     TEXT PRIMARY KEY,
        UserID      TEXT NOT NULL,
        Name        TEXT NOT NULL,
        Description TEXT,
        Year        TEXT,
        FOREIGN KEY (UserID) REFERENCES tblUsers(UserID)
    )`)

    // AI: saved job postings the user wants to tailor their resume toward
    db.run(`CREATE TABLE IF NOT EXISTS tblTargetJobs (
        TargetJobID  TEXT PRIMARY KEY,
        UserID       TEXT NOT NULL,
        Title        TEXT NOT NULL,
        Company      TEXT,
        Description  TEXT NOT NULL,
        FOREIGN KEY (UserID) REFERENCES tblUsers(UserID)
    )`)
})

// AI: promise-based wrappers so every API file can use async/await instead of SQLite callbacks
// db.allAsync  → returns all matching rows as an array
// db.getAsync  → returns the first matching row (or undefined)
// db.runAsync  → runs INSERT / UPDATE / DELETE; resolves with { changes, lastID }
db.allAsync = (strSql, arrParams = []) => new Promise((resolve, reject) => {
    db.all(strSql, arrParams, (err, rows) => err ? reject(err) : resolve(rows))
})

db.getAsync = (strSql, arrParams = []) => new Promise((resolve, reject) => {
    db.get(strSql, arrParams, (err, row) => err ? reject(err) : resolve(row))
})

db.runAsync = (strSql, arrParams = []) => new Promise((resolve, reject) => {
    db.run(strSql, arrParams, function(err) { err ? reject(err) : resolve(this) })
})

module.exports = db
