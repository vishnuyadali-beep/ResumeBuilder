// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/skills.js — Skills routes (/api/skills)
//
// Full CRUD for skills (tblSkills). All routes require a valid JWT.
// Skills have a Name and an optional Category (e.g. "Programming Languages").
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken)

// AI: GET /api/skills — returns all skills for the logged-in user, ordered by category then name
router.get('/', async (req, res) => {
    try {
        const arrSkills = await db.allAsync(
            'SELECT * FROM tblSkills WHERE UserID = ? ORDER BY Category, Name',
            [req.user.userID]
        )
        res.status(200).json(arrSkills)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: POST /api/skills — validates the name, generates a UUID, and inserts a new row into tblSkills
router.post('/', async (req, res) => {
    const strName = req.body.name ? req.body.name.trim() : ''
    const strCategory = req.body.category ? req.body.category.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Skill name is required.' })

    try {
        const strSkillID = uuidv4()
        await db.runAsync(
            'INSERT INTO tblSkills (SkillID, UserID, Name, Category) VALUES (?, ?, ?, ?)',
            [strSkillID, req.user.userID, strName, strCategory]
        )
        res.status(201).json({ message: 'Skill added', skillID: strSkillID })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/skills/:id — updates name and category, scoped to the logged-in user's skills only
router.put('/:id', async (req, res) => {
    const strSkillID = req.params.id
    const strName = req.body.name ? req.body.name.trim() : ''
    const strCategory = req.body.category ? req.body.category.trim() : ''

    if (strName.length < 1) return res.status(400).json({ message: 'Skill name is required.' })

    try {
        const objResult = await db.runAsync(
            'UPDATE tblSkills SET Name = ?, Category = ? WHERE SkillID = ? AND UserID = ?',
            [strName, strCategory, strSkillID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Skill not found' })
        res.status(200).json({ message: 'Skill updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/skills/:id — removes the skill record, scoped to the logged-in user
router.delete('/:id', async (req, res) => {
    const strSkillID = req.params.id
    try {
        const objResult = await db.runAsync(
            'DELETE FROM tblSkills WHERE SkillID = ? AND UserID = ?',
            [strSkillID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Skill not found' })
        res.status(200).json({ message: 'Skill deleted' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
