// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/jobs.js — Work experience routes (/api/jobs)
//
// Full CRUD for jobs (tblJobs) and their individual responsibility bullet points
// (tblJobDetails). All routes require a valid JWT via verifyToken.
//
// /api/jobs              — list, create, update, delete jobs
// /api/jobs/:id/details  — list, create, update, delete responsibilities
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken)

// AI: GET /api/jobs — returns all work experience entries for the logged-in user, ordered by start date descending
router.get('/', async (req, res) => {
    try {
        const arrJobs = await db.allAsync(
            'SELECT * FROM tblJobs WHERE UserID = ? ORDER BY StartDate DESC',
            [req.user.userID]
        )
        res.status(200).json(arrJobs)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: POST /api/jobs — validates required fields, generates a UUID, and inserts a new job into tblJobs
router.post('/', async (req, res) => {
    const strTitle = req.body.title ? req.body.title.trim() : ''
    const strCompany = req.body.company ? req.body.company.trim() : ''
    const strStartDate = req.body.startDate ? req.body.startDate.trim() : ''
    const strEndDate = req.body.endDate ? req.body.endDate.trim() : ''

    let blnError = false
    let strMessage = ''
    if (strTitle.length < 1) { blnError = true; strMessage += 'Job title is required. ' }
    if (strCompany.length < 1) { blnError = true; strMessage += 'Company is required. ' }
    if (blnError) return res.status(400).json({ message: strMessage.trim() })

    try {
        const strJobID = uuidv4()
        await db.runAsync(
            'INSERT INTO tblJobs (JobID, UserID, Title, Company, StartDate, EndDate) VALUES (?, ?, ?, ?, ?, ?)',
            [strJobID, req.user.userID, strTitle, strCompany, strStartDate, strEndDate]
        )
        res.status(201).json({ message: 'Job created', jobID: strJobID })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/jobs/:id — updates title, company, and dates, scoped to the logged-in user's jobs
router.put('/:id', async (req, res) => {
    const strJobID = req.params.id
    const strTitle = req.body.title ? req.body.title.trim() : ''
    const strCompany = req.body.company ? req.body.company.trim() : ''
    const strStartDate = req.body.startDate ? req.body.startDate.trim() : ''
    const strEndDate = req.body.endDate ? req.body.endDate.trim() : ''

    let blnError = false
    let strMessage = ''
    if (strTitle.length < 1) { blnError = true; strMessage += 'Job title is required. ' }
    if (strCompany.length < 1) { blnError = true; strMessage += 'Company is required. ' }
    if (blnError) return res.status(400).json({ message: strMessage.trim() })

    try {
        const objResult = await db.runAsync(
            'UPDATE tblJobs SET Title = ?, Company = ?, StartDate = ?, EndDate = ? WHERE JobID = ? AND UserID = ?',
            [strTitle, strCompany, strStartDate, strEndDate, strJobID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Job not found' })
        res.status(200).json({ message: 'Job updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/jobs/:id — deletes all responsibilities first (FK constraint), then the job row itself
router.delete('/:id', async (req, res) => {
    const strJobID = req.params.id
    try {
        // AI: responsibilities must be deleted first — tblJobDetails.JobID has a FOREIGN KEY to tblJobs.JobID
        await db.runAsync('DELETE FROM tblJobDetails WHERE JobID = ?', [strJobID])
        const objResult = await db.runAsync(
            'DELETE FROM tblJobs WHERE JobID = ? AND UserID = ?',
            [strJobID, req.user.userID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Job not found' })
        res.status(200).json({ message: 'Job deleted' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: GET /api/jobs/:id/details — returns all responsibility bullet points for a specific job
router.get('/:id/details', async (req, res) => {
    const strJobID = req.params.id
    try {
        // AI: JOIN to tblJobs ensures users can only access details belonging to their own jobs
        const arrDetails = await db.allAsync(
            `SELECT d.* FROM tblJobDetails d
             JOIN tblJobs j ON d.JobID = j.JobID
             WHERE d.JobID = ? AND j.UserID = ?`,
            [strJobID, req.user.userID]
        )
        res.status(200).json(arrDetails)
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: POST /api/jobs/:id/details — validates the description and inserts a new responsibility bullet point
router.post('/:id/details', async (req, res) => {
    const strJobID = req.params.id
    const strDescription = req.body.description ? req.body.description.trim() : ''

    if (strDescription.length < 1) return res.status(400).json({ message: 'Description is required.' })

    try {
        const strDetailID = uuidv4()
        await db.runAsync(
            'INSERT INTO tblJobDetails (DetailID, JobID, Description) VALUES (?, ?, ?)',
            [strDetailID, strJobID, strDescription]
        )
        res.status(201).json({ message: 'Detail added', detailID: strDetailID })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: PUT /api/jobs/:jobId/details/:detailId — updates the text of a single responsibility bullet point
router.put('/:jobId/details/:detailId', async (req, res) => {
    const strDetailID = req.params.detailId
    const strDescription = req.body.description ? req.body.description.trim() : ''

    if (strDescription.length < 1) return res.status(400).json({ message: 'Description is required.' })

    try {
        const objResult = await db.runAsync(
            'UPDATE tblJobDetails SET Description = ? WHERE DetailID = ?',
            [strDescription, strDetailID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Detail not found' })
        res.status(200).json({ message: 'Detail updated' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

// AI: DELETE /api/jobs/:jobId/details/:detailId — removes a single responsibility bullet point
router.delete('/:jobId/details/:detailId', async (req, res) => {
    const strDetailID = req.params.detailId
    try {
        const objResult = await db.runAsync(
            'DELETE FROM tblJobDetails WHERE DetailID = ?',
            [strDetailID]
        )
        if (objResult.changes === 0) return res.status(404).json({ message: 'Detail not found' })
        res.status(200).json({ message: 'Detail deleted' })
    } catch (objErr) {
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
