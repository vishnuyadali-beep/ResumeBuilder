// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/awards.js — Awards routes (/api/awards)
//
// Full CRUD for awards and honors (tblAwards). All routes require a valid JWT.
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken)

// AI: GET /api/awards — returns all awards for the logged-in user, ordered by year descending
router.get('/', async (req, res) => {
    try {
        const arrAwards = await db.allAsync(
            'SELECT * FROM tblAwards WHERE UserID = ? ORDER BY Year DESC, Name',
            [req.user.userID]
        )
        res.status(200).json(arrAwards)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: POST /api/awards — validates the name, generates a UUID, and inserts a new row into tblAwards
router.post('/', async (req, res) => {
    const strName = req.body.name ? req.body.name.trim() : ''
    const strDescription = req.body.description ? req.body.description.trim() : ''
    const strYear = req.body.year ? req.body.year.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Award name is required.' })

    try {
        const strAwardID = uuidv4()
        await db.runAsync(
            'INSERT INTO tblAwards (AwardID, UserID, Name, Description, Year) VALUES (?, ?, ?, ?, ?)',
            [strAwardID, req.user.userID, strName, strDescription, strYear]
        )
        res.status(201).json({ message: 'Award added', awardID: strAwardID })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/awards/:id — updates name, description, and year, scoped to the logged-in user's awards only
router.put('/:id', async (req, res) => {
    const strAwardID = req.params.id
    const strName = req.body.name ? req.body.name.trim() : ''
    const strDescription = req.body.description ? req.body.description.trim() : ''
    const strYear = req.body.year ? req.body.year.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Award name is required.' })

    try {
        const objResult = await db.runAsync(
            'UPDATE tblAwards SET Name = ?, Description = ?, Year = ? WHERE AwardID = ? AND UserID = ?',
            [strName, strDescription, strYear, strAwardID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Award not found' })
        res.status(200).json({ message: 'Award updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/awards/:id — removes the award record, scoped to the logged-in user
router.delete('/:id', async (req, res) => {
    const strAwardID = req.params.id
    try {
        const objResult = await db.runAsync(
            'DELETE FROM tblAwards WHERE AwardID = ? AND UserID = ?',
            [strAwardID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Award not found' })
        res.status(200).json({ message: 'Award deleted' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
