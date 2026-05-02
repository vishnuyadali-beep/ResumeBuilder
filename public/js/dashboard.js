// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// dashboard.js — Dashboard page logic
//
// On page load: verifies auth, shows the welcome name, fetches the stat counts
// (jobs, skills, certifications, awards), and loads the profile form.
// The profile form toggles open/closed and saves changes to /api/users/profile.
// ─────────────────────────────────────────────────────────────────────────────

// AI: verifies auth on page load, shows the welcome name, loads stats and profile, and wires up the profile toggle
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return

    const strUserName = localStorage.getItem('strUserName')
    document.getElementById('spnWelcomeName').textContent = strUserName || ''

    await loadStats()
    await loadProfile()
    initProfileForm()

    document.getElementById('btnToggleProfile').addEventListener('click', () => {
        const elForm = document.getElementById('divProfileForm')
        const blnHidden = elForm.classList.contains('d-none')
        elForm.classList.toggle('d-none', !blnHidden)
        document.getElementById('btnToggleProfile').setAttribute('aria-expanded', blnHidden)
    })
})

// AI: fetches all four stat counts in parallel with Promise.all and updates the dashboard counters
async function loadStats() {
    const [objJobsRes, objSkillsRes, objCertsRes, objAwardsRes] = await Promise.all([
        authUtils.fetchWithAuth('/api/jobs'),
        authUtils.fetchWithAuth('/api/skills'),
        authUtils.fetchWithAuth('/api/certifications'),
        authUtils.fetchWithAuth('/api/awards')
    ])

    const arrJobs = await objJobsRes.json()
    const arrSkills = await objSkillsRes.json()
    const arrCerts = await objCertsRes.json()
    const arrAwards = await objAwardsRes.json()

    document.getElementById('spnJobCount').textContent = Array.isArray(arrJobs) ? arrJobs.length : 0
    document.getElementById('spnSkillCount').textContent = Array.isArray(arrSkills) ? arrSkills.length : 0
    document.getElementById('spnCertCount').textContent = Array.isArray(arrCerts) ? arrCerts.length : 0
    document.getElementById('spnAwardCount').textContent = Array.isArray(arrAwards) ? arrAwards.length : 0
}

// AI: fetches the logged-in user's profile and populates all form fields including the Gemini API key
async function loadProfile() {
    const objRes = await authUtils.fetchWithAuth('/api/users/profile')
    const arrRows = await objRes.json()
    if (!objRes.ok || arrRows.length < 1) return

    const objProfile = arrRows[0]
    document.getElementById('inpProfileName').value = objProfile.Name || ''
    document.getElementById('inpProfilePhone').value = objProfile.Phone || ''
    document.getElementById('inpProfileAddress').value = objProfile.Address || ''
    document.getElementById('txaProfileSummary').value = objProfile.Summary || ''
    document.getElementById('inpGeminiKey').value = objProfile.GeminiAPIKey || ''
}

// AI: wires up the profile form submit handler; on success updates the navbar and welcome name from localStorage
function initProfileForm() {
    document.getElementById('frmProfile').addEventListener('submit', async (evt) => {
        evt.preventDefault()
        const elAlert = document.getElementById('divProfileAlert')
        elAlert.className = 'alert d-none'

        const strName = document.getElementById('inpProfileName').value.trim()
        const strPhone = document.getElementById('inpProfilePhone').value.trim()
        const strAddress = document.getElementById('inpProfileAddress').value.trim()
        const strSummary = document.getElementById('txaProfileSummary').value.trim()
        const strGeminiAPIKey = document.getElementById('inpGeminiKey').value.trim()

        const objRes = await authUtils.fetchWithAuth('/api/users/profile', {
            method: 'PUT',
            body: { name: strName, phone: strPhone, address: strAddress, summary: strSummary, geminiAPIKey: strGeminiAPIKey }
        })
        const objData = await objRes.json()

        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }

        localStorage.setItem('strUserName', strName)
        document.getElementById('spnUserName').textContent = strName
        document.getElementById('spnWelcomeName').textContent = strName
        elAlert.className = 'alert alert-success'
        elAlert.textContent = 'Profile saved.'
    })
}
