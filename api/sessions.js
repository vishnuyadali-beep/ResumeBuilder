// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/sessions.js — Login and logout (/api/sessions)
//
// A "session" is represented by a JWT token stored in the client's localStorage.
// POST / — verifies credentials and returns a signed token (log in)
// DELETE / — logout endpoint; the client is responsible for discarding its token
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db/init')

const router = express.Router()

// AI: POST /api/sessions — looks up the user by email, verifies the password with bcrypt, and returns a signed JWT
router.post('/', async (req, res) => {
    const strEmail = req.body.email ? req.body.email.trim().toLowerCase() : ''
    const strPassword = req.body.password ? req.body.password : ''

    if (!strEmail || !strPassword) {
        return res.status(400).json({ message: 'Email and password are required.' })
    }

    try {
        const objUser = await db.getAsync(
            'SELECT UserID, Email, Password, Name FROM tblUsers WHERE Email = ?',
            [strEmail]
        )

        // AI: same error message for unknown email or wrong password — prevents account enumeration
        if (!objUser) {
            return res.status(401).json({ message: 'Invalid email or password.' })
        }

        // AI: re-hashes the submitted password with bcrypt and checks equality against the stored hash
        const blnMatch = await bcrypt.compare(strPassword, objUser.Password)
        if (!blnMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' })
        }

        // AI: signs a 12-hour JWT containing the user's ID, email, and name for use in the Authorization header
        const strToken = jwt.sign(
            { userID: objUser.UserID, email: objUser.Email, name: objUser.Name },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        )

        res.status(201).json({ token: strToken, name: objUser.Name })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/sessions — logout endpoint; the client is responsible for discarding its stored token
router.delete('/', (req, res) => {
    res.status(200).json({ message: 'Logged out' })
})

module.exports = router
