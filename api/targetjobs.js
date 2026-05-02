// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/targetjobs.js — Target job routes (/api/targetjobs)
//
// Full CRUD for saved target job postings (tblTargetJobs).
// These are job listings the user saves so the AI can tailor their resume to them.
// All routes require a valid JWT.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken)

// AI: GET /api/targetjobs — returns all saved target jobs for the logged-in user, ordered by title
router.get('/', async (req, res) => {
    try {
        const arrTargetJobs = await db.allAsync(
            'SELECT * FROM tblTargetJobs WHERE UserID = ? ORDER BY Title',
            [req.user.userID]
        )
        res.status(200).json(arrTargetJobs)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: POST /api/targetjobs — validates title and description, generates a UUID, and saves the job posting
router.post('/', async (req, res) => {
    const strTitle = req.body.title ? req.body.title.trim() : ''
    const strCompany = req.body.company ? req.body.company.trim() : ''
    const strDescription = req.body.description ? req.body.description.trim() : ''

    let blnError = false
    let strMessage = ''
    if (strTitle.length < 1) { blnError = true; strMessage += 'Job title is required. ' }
    if (strDescription.length < 1) { blnError = true; strMessage += 'Job description is required. ' }
    if (blnError) return res.status(400).json({ message: strMessage.trim() })

    try {
        const strTargetJobID = uuidv4()
        await db.runAsync(
            'INSERT INTO tblTargetJobs (TargetJobID, UserID, Title, Company, Description) VALUES (?, ?, ?, ?, ?)',
            [strTargetJobID, req.user.userID, strTitle, strCompany, strDescription]
        )
        res.status(201).json({ message: 'Target job saved', targetJobID: strTargetJobID })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/targetjobs/:id — updates title, company, and description, scoped to the logged-in user
router.put('/:id', async (req, res) => {
    const strTargetJobID = req.params.id
    const strTitle = req.body.title ? req.body.title.trim() : ''
    const strCompany = req.body.company ? req.body.company.trim() : ''
    const strDescription = req.body.description ? req.body.description.trim() : ''

    let blnError = false
    let strMessage = ''
    if (strTitle.length < 1) { blnError = true; strMessage += 'Job title is required. ' }
    if (strDescription.length < 1) { blnError = true; strMessage += 'Job description is required. ' }
    if (blnError) return res.status(400).json({ message: strMessage.trim() })

    try {
        const objResult = await db.runAsync(
            'UPDATE tblTargetJobs SET Title = ?, Company = ?, Description = ? WHERE TargetJobID = ? AND UserID = ?',
            [strTitle, strCompany, strDescription, strTargetJobID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Target job not found' })
        res.status(200).json({ message: 'Target job updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/targetjobs/:id — removes the target job record, scoped to the logged-in user
router.delete('/:id', async (req, res) => {
    const strTargetJobID = req.params.id
    try {
        const objResult = await db.runAsync(
            'DELETE FROM tblTargetJobs WHERE TargetJobID = ? AND UserID = ?',
            [strTargetJobID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Target job not found' })
        res.status(200).json({ message: 'Target job deleted' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
