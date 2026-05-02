// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/users.js — User account routes (/api/users)
//
// POST /         — register a new account (no auth required)
// GET  /profile  — return the logged-in user's profile data
// PUT  /profile  — save changes to the logged-in user's profile
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()

// AI: POST /api/users — validates input, hashes the password with bcrypt, and creates a new user account
router.post('/', async (req, res) => {
    const strName = req.body.name ? req.body.name.trim() : ''
    const strEmail = req.body.email ? req.body.email.trim().toLowerCase() : ''
    const strPassword = req.body.password ? req.body.password : ''

    let blnError = false
    let strMessage = ''
    if (strName.length < 1) { blnError = true; strMessage += 'Name is required. ' }
    if (strEmail.length < 1 || !strEmail.includes('@')) { blnError = true; strMessage += 'A valid email is required. ' }
    if (strPassword.length < 8) { blnError = true; strMessage += 'Password must be at least 8 characters. ' }
    if (blnError) return res.status(400).json({ message: strMessage.trim() })

    try {
        const strUserID = uuidv4()
        // AI: hashes the password with bcrypt at cost factor 12 before inserting — the plain-text password is never stored
        const strHashedPassword = await bcrypt.hash(strPassword, 12)
        await db.runAsync(
            'INSERT INTO tblUsers (UserID, Email, Password, Name) VALUES (?, ?, ?, ?)',
            [strUserID, strEmail, strHashedPassword, strName]
        )
        res.status(201).json({ message: 'Account created successfully' })
    } catch (objErr) {
        // AI: tblUsers.Email has a UNIQUE constraint — translates the SQLite error into a friendly 409
        if (objErr.message.includes('UNIQUE')) {
            return res.status(409).json({ message: 'An account with that email already exists.' })
        }
        res.status(500).json({ message: objErr.message })
    }
})

// AI: GET /api/users/profile — returns all profile fields including the Gemini API key for the dashboard form
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const arrRows = await db.allAsync(
            'SELECT UserID, Email, Name, Phone, Address, Summary, GeminiAPIKey FROM tblUsers WHERE UserID = ?',
            [req.user.userID]
        )
        if (arrRows.length < 1) return res.status(404).json({ message: 'User not found' })
        res.status(200).json(arrRows)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/users/profile — saves name, phone, address, summary, and Gemini API key for the logged-in user
router.put('/profile', verifyToken, async (req, res) => {
    const strName = req.body.name ? req.body.name.trim() : ''
    const strPhone = req.body.phone ? req.body.phone.trim() : ''
    const strAddress = req.body.address ? req.body.address.trim() : ''
    const strSummary = req.body.summary ? req.body.summary.trim() : ''
    // AI: the Gemini API key is stored server-side per user so it is never sent to the browser
    const strGeminiAPIKey = req.body.geminiAPIKey ? req.body.geminiAPIKey.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Name is required.' })

    try {
        await db.runAsync(
            'UPDATE tblUsers SET Name = ?, Phone = ?, Address = ?, Summary = ?, GeminiAPIKey = ? WHERE UserID = ?',
            [strName, strPhone, strAddress, strSummary, strGeminiAPIKey, req.user.userID]
        )
        res.status(200).json({ message: 'Profile updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
