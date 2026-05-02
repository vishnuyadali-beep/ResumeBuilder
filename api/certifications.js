// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/certifications.js — Certifications routes (/api/certifications)
//
// Full CRUD for certifications (tblCertifications). All routes require a valid JWT.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken)

// AI: GET /api/certifications — returns all certifications for the logged-in user, ordered by year descending
router.get('/', async (req, res) => {
    try {
        const arrCerts = await db.allAsync(
            'SELECT * FROM tblCertifications WHERE UserID = ? ORDER BY Year DESC, Name',
            [req.user.userID]
        )
        res.status(200).json(arrCerts)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: POST /api/certifications — validates the name, generates a UUID, and inserts a new row into tblCertifications
router.post('/', async (req, res) => {
    const strName = req.body.name ? req.body.name.trim() : ''
    const strIssuer = req.body.issuer ? req.body.issuer.trim() : ''
    const strYear = req.body.year ? req.body.year.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Certification name is required.' })

    try {
        const strCertID = uuidv4()
        await db.runAsync(
            'INSERT INTO tblCertifications (CertID, UserID, Name, Issuer, Year) VALUES (?, ?, ?, ?, ?)',
            [strCertID, req.user.userID, strName, strIssuer, strYear]
        )
        res.status(201).json({ message: 'Certification added', certID: strCertID })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/certifications/:id — updates name, issuer, and year, scoped to the logged-in user's certifications only
router.put('/:id', async (req, res) => {
    const strCertID = req.params.id
    const strName = req.body.name ? req.body.name.trim() : ''
    const strIssuer = req.body.issuer ? req.body.issuer.trim() : ''
    const strYear = req.body.year ? req.body.year.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Certification name is required.' })

    try {
        const objResult = await db.runAsync(
            'UPDATE tblCertifications SET Name = ?, Issuer = ?, Year = ? WHERE CertID = ? AND UserID = ?',
            [strName, strIssuer, strYear, strCertID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Certification not found' })
        res.status(200).json({ message: 'Certification updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/certifications/:id — removes the certification record, scoped to the logged-in user
router.delete('/:id', async (req, res) => {
    const strCertID = req.params.id
    try {
        const objResult = await db.runAsync(
            'DELETE FROM tblCertifications WHERE CertID = ? AND UserID = ?',
            [strCertID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Certification not found' })
        res.status(200).json({ message: 'Certification deleted' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
