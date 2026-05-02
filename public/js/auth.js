// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// auth.js — Shared authentication utilities (included on every protected page)
//
// Provides two helpers used by every page that requires a login:
//   authUtils.requireAuth()       — redirects to login if no token is stored;
//                                   also populates the navbar username display
//   authUtils.fetchWithAuth(url)  — wrapper around fetch() that automatically
//                                   adds the Authorization: Bearer header
// ─────────────────────────────────────────────────────────────────────────────

const authUtils = {
    // AI: retrieves the stored JWT from localStorage
    getToken() {
        return localStorage.getItem('strAuthToken')
    },

    // AI: redirects to login if no token is present; populates the navbar username and wires up the logout button
    requireAuth() {
        if (!this.getToken()) {
            window.location.href = '/index.html'
            return false
        }
        const strUserName = localStorage.getItem('strUserName')
        const elSpnUserName = document.getElementById('spnUserName')
        if (elSpnUserName && strUserName) {
            elSpnUserName.textContent = strUserName
        }
        const elBtnLogout = document.getElementById('btnLogout')
        if (elBtnLogout) {
            elBtnLogout.addEventListener('click', async () => {
                await fetch('/api/sessions', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${this.getToken()}` }
                })
                localStorage.removeItem('strAuthToken')
                localStorage.removeItem('strUserName')
                window.location.href = '/index.html'
            })
        }
        return true
    },

    // AI: wraps fetch() to automatically inject the Authorization header and serialize object bodies as JSON
    async fetchWithAuth(strUrl, objOptions = {}) {
        const objHeaders = { 'Authorization': `Bearer ${this.getToken()}` }
        if (objOptions.body && typeof objOptions.body === 'object') {
            objHeaders['Content-Type'] = 'application/json'
            objOptions.body = JSON.stringify(objOptions.body)
        }
        objOptions.headers = { ...objHeaders, ...objOptions.headers }
        return fetch(strUrl, objOptions)
    }
}
