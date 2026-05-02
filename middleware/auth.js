// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// middleware/auth.js — JWT authentication middleware
//
// Exports verifyToken, which is applied to every protected route.
// It reads the Bearer token from the Authorization header, verifies it
// against JWT_SECRET, and attaches the decoded payload to req.user.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken')

// AI: reads the Authorization header, verifies the JWT, and attaches the decoded payload to req.user;
//     sends a 401 and stops the request chain if the token is missing or invalid
function verifyToken(req, res, next) {
    const strAuthHeader = req.headers.authorization
    if (!strAuthHeader || !strAuthHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' })
    }

    const strToken = strAuthHeader.split(' ')[1]
    try {
        req.user = jwt.verify(strToken, process.env.JWT_SECRET)
        next()
    } catch (objErr) {
        res.status(401).json({ message: 'Invalid or expired token' })
    }
}

module.exports = { verifyToken }
