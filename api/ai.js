// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// api/ai.js — Gemini AI routes (/api/ai)
//
// Proxies requests to Google's Gemini API using the user's own API key,
// which is stored server-side and never sent to the browser.
//
// POST /suggest — rewrites a resume bullet point using strong action verbs
// POST /tailor  — cross-references the user's resume against a job description
//                 and returns numbered, actionable improvement suggestions
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express')
const db = require('../db/init')
const { verifyToken } = require('../middleware/auth')

const router = express.Router()
router.use(verifyToken)

// AI: looks up the logged-in user's Gemini API key from the database
async function getAPIKey(strUserID) {
    const objUser = await db.getAsync(
        'SELECT GeminiAPIKey FROM tblUsers WHERE UserID = ?',
        [strUserID]
    )
    if (!objUser || !objUser.GeminiAPIKey) throw new Error('no_key')
    return objUser.GeminiAPIKey
}

// AI: sends a prompt to the Gemini API and returns the text response
async function callGemini(strAPIKey, strPrompt) {
    const objResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${strAPIKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: strPrompt }] }] })
        }
    )
    if (!objResponse.ok) {
        const objError = await objResponse.json()
        throw new Error('Gemini API error: ' + (objError.error?.message || 'Check your API key.'))
    }
    const objData = await objResponse.json()
    return objData.candidates[0].content.parts[0].text.trim()
}

// POST /api/ai/suggest
// AI: sends a piece of resume text to Gemini and returns an improved version
router.post('/suggest', async (req, res) => {
    const strText = req.body.text ? req.body.text.trim() : ''
    const strContext = req.body.context ? req.body.context.trim() : 'resume content'

    if (strText.length < 1) return res.status(400).json({ message: 'Text is required.' })

    try {
        const strAPIKey = await getAPIKey(req.user.userID)

        // AI: instructs Gemini to return only the improved text with no explanation
        const strPrompt = `You are a professional resume writer. Review the following ${strContext} and suggest a concise, improved version using strong action verbs. Respond with only the improved text, no explanation. Content: "${strText}"`
        const strSuggestion = await callGemini(strAPIKey, strPrompt)

        res.status(200).json([{ suggestion: strSuggestion }])
    } catch (objErr) {
        if (objErr.message === 'no_key') {
            return res.status(400).json({ message: 'No Gemini API key found. Please add your API key in the Dashboard settings.' })
        }
        res.status(500).json({ message: objErr.message })
    }
})

// POST /api/ai/tailor
// AI: compares the user's resume against a job description and returns specific improvement suggestions
router.post('/tailor', async (req, res) => {
    const strResumeContent = req.body.resumeContent ? req.body.resumeContent.trim() : ''
    const strJobDescription = req.body.jobDescription ? req.body.jobDescription.trim() : ''

    let blnError = false
    let strMessage = ''
    if (strResumeContent.length < 1) { blnError = true; strMessage += 'Resume content is required. ' }
    if (strJobDescription.length < 1) { blnError = true; strMessage += 'Job description is required. ' }
    if (blnError) return res.status(400).json({ message: strMessage.trim() })

    try {
        const strAPIKey = await getAPIKey(req.user.userID)

        // AI: provides both the job description and resume so Gemini can cross-reference them
        const strPrompt = `You are a professional resume writer. A job seeker wants to tailor their resume for a specific role.

Job Description:
${strJobDescription}

Current Resume Content:
${strResumeContent}

Provide 4-6 specific, actionable suggestions to better tailor this resume to the job description. For each suggestion include:
- A specific bullet point or section to change
- The recommended revision or addition
- Why it helps match the role

Format each suggestion as a numbered list item. Be concise and specific.`

        const strSuggestion = await callGemini(strAPIKey, strPrompt)
        res.status(200).json([{ suggestion: strSuggestion }])
    } catch (objErr) {
        if (objErr.message === 'no_key') {
            return res.status(400).json({ message: 'No Gemini API key found. Please add your API key in the Dashboard settings.' })
        }
        res.status(500).json({ message: objErr.message })
    }
})

// POST /api/ai/autofill
// AI: rewrites the selected resume content (summary + bullets) to match a job description,
//     returning structured JSON so the preview can be updated in place without saving to DB
router.post('/autofill', async (req, res) => {
    const strJobDescription = req.body.jobDescription ? req.body.jobDescription.trim() : ''
    const strSummary = req.body.summary ? req.body.summary.trim() : ''
    const arrBullets = Array.isArray(req.body.bullets) ? req.body.bullets : []

    if (strJobDescription.length < 1) return res.status(400).json({ message: 'Job description is required.' })
    if (strSummary.length < 1 && arrBullets.length < 1) return res.status(400).json({ message: 'No resume content to rewrite.' })

    try {
        const strAPIKey = await getAPIKey(req.user.userID)

        // AI: instructs Gemini to rewrite both the summary and bullets to match the job description, returning structured JSON
        const strPrompt = `You are a professional resume writer. Rewrite the resume content below to better match the job description. Return ONLY valid JSON — no markdown, no explanation.

Job Description:
${strJobDescription}

Current Professional Summary:
${strSummary || '(none)'}

Current Bullet Points (0-indexed):
${arrBullets.map((strB, intI) => `${intI}. ${strB}`).join('\n')}

Return JSON in this exact format:
{
  "summary": "rewritten summary tailored to the job",
  "bullets": ["improved bullet 0", "improved bullet 1"]
}

Rules:
- Keep the same number of bullets in the same order
- Use strong action verbs and quantify impact where possible
- Mirror keywords from the job description naturally
- Keep each bullet to one concise sentence
- If the current summary is empty, write one based on the bullets and job description`

        // Gemini may wrap the response in extra text, so grab only the JSON object
        const strRaw = await callGemini(strAPIKey, strPrompt)
        const strClean = strRaw.slice(strRaw.indexOf('{'), strRaw.lastIndexOf('}') + 1)
        const objResult = JSON.parse(strClean)

        if (typeof objResult.summary !== 'string' || !Array.isArray(objResult.bullets)) {
            throw new Error('Unexpected response format from AI.')
        }

        res.status(200).json(objResult)
    } catch (objErr) {
        if (objErr.message === 'no_key') {
            return res.status(400).json({ message: 'No Gemini API key found. Please add your API key in the Dashboard settings.' })
        }
        if (objErr instanceof SyntaxError) {
            return res.status(500).json({ message: 'AI returned an unexpected format. Please try again.' })
        }
        res.status(500).json({ message: objErr.message })
    }
})

module.exports = router
