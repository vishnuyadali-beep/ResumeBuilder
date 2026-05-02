// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// builder.js — Resume builder page logic
//
// Loads all of the user's data (profile, jobs + details, skills, certs, awards,
// target jobs) then renders checkboxes so the user can pick what to include.
// On Generate, assembles the selected items into a styled HTML resume preview.
// The AI tailor feature sends the selected resume text + a job description to
// /api/ai/tailor and displays Gemini's numbered improvement suggestions.
// ─────────────────────────────────────────────────────────────────────────────

let objProfile = {}
let arrAllJobs = []
let arrAllSkills = []
let arrAllCerts = []
let arrAllAwards = []
let arrTargetJobs = []

// AI: verifies auth on page load, fetches all resume data, renders the selection UI, and wires up controls
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return
    await loadAllData()
    renderSelections()
    initControls()
})

// ── Data loading ──────────────────────────────────────────────────────────────

// AI: fetches all six data sets in parallel then loads each job's responsibility details sequentially
async function loadAllData() {
    const [objProfileRes, objJobsRes, objSkillsRes, objCertsRes, objAwardsRes, objTargetJobsRes] = await Promise.all([
        authUtils.fetchWithAuth('/api/users/profile'),
        authUtils.fetchWithAuth('/api/jobs'),
        authUtils.fetchWithAuth('/api/skills'),
        authUtils.fetchWithAuth('/api/certifications'),
        authUtils.fetchWithAuth('/api/awards'),
        authUtils.fetchWithAuth('/api/targetjobs')
    ])

    const arrProfileRows = await objProfileRes.json()
    objProfile = arrProfileRows[0] || {}
    arrAllJobs = await objJobsRes.json()
    arrAllSkills = await objSkillsRes.json()
    arrAllCerts = await objCertsRes.json()
    arrAllAwards = await objAwardsRes.json()
    arrTargetJobs = await objTargetJobsRes.json()

    for (const objJob of arrAllJobs) {
        const objDetailsRes = await authUtils.fetchWithAuth(`/api/jobs/${objJob.JobID}/details`)
        objJob.arrDetails = await objDetailsRes.json()
    }
}

// ── Date helper ───────────────────────────────────────────────────────────────

// AI: converts a YYYY-MM date string into a human-readable "Month YYYY" format for the resume preview
function formatDate(strDate) {
    if (!strDate) return ''
    const arrMonths = ['January','February','March','April','May','June','July','August','September','October','November','December']
    const arrParts = strDate.split('-')
    const intMonth = parseInt(arrParts[1])
    return intMonth ? `${arrMonths[intMonth - 1]} ${arrParts[0]}` : arrParts[0]
}

// ── Render selection checkboxes ───────────────────────────────────────────────

// AI: renders all four selection sections (jobs, skills, certs, awards) and populates the target job dropdown
function renderSelections() {
    renderJobSelection()
    renderSimpleSelection('divSkillSelection', arrAllSkills, 'skill', (s) => s.Name, (s) => s.SkillID)
    renderSimpleSelection('divCertSelection', arrAllCerts, 'cert', (c) => `${c.Name}${c.Issuer ? ' — ' + c.Issuer : ''}`, (c) => c.CertID)
    renderSimpleSelection('divAwardSelection', arrAllAwards, 'award', (a) => a.Name, (a) => a.AwardID)
    populateTargetJobDropdown()
}

// AI: renders each job as an accordion item with a job-level checkbox and individual detail checkboxes inside
function renderJobSelection() {
    const elContainer = document.getElementById('divJobSelection')
    elContainer.innerHTML = ''

    if (!Array.isArray(arrAllJobs) || arrAllJobs.length < 1) {
        elContainer.innerHTML = '<p class="text-muted">No jobs found. <a href="/jobs.html">Add some jobs first.</a></p>'
        return
    }

    arrAllJobs.forEach((objJob, intIndex) => {
        const strCollapseID = `collapseJob${intIndex}`
        const strStart = formatDate(objJob.StartDate)
        const strEnd = objJob.EndDate ? formatDate(objJob.EndDate) : 'Present'
        const strDates = strStart ? `${strStart} – ${strEnd}` : ''

        const elItem = document.createElement('div')
        elItem.className = 'accordion-item'
        elItem.innerHTML = `
            <h2 class="accordion-header">
                <button class="accordion-button collapsed d-flex align-items-center gap-3" type="button"
                    data-bs-toggle="collapse" data-bs-target="#${strCollapseID}"
                    aria-expanded="false" aria-controls="${strCollapseID}">
                    <input type="checkbox" class="form-check-input job-checkbox flex-shrink-0"
                        id="chkJob${intIndex}" data-job-id="${objJob.JobID}"
                        aria-label="Include ${objJob.Title} at ${objJob.Company}">
                    <label class="mb-0" for="chkJob${intIndex}">
                        <span class="fw-semibold">${objJob.Title}</span>
                        <span class="text-muted ms-2 small">${objJob.Company}${strDates ? ' · ' + strDates : ''}</span>
                    </label>
                </button>
            </h2>
            <div id="${strCollapseID}" class="accordion-collapse collapse">
                <div class="accordion-body">
                    <p class="small text-muted mb-2">Select responsibilities to include:</p>
                    <div class="detail-checkboxes" data-job-id="${objJob.JobID}"></div>
                </div>
            </div>`

        const elDetailContainer = elItem.querySelector('.detail-checkboxes')
        if (Array.isArray(objJob.arrDetails) && objJob.arrDetails.length > 0) {
            objJob.arrDetails.forEach((objDetail, intDIdx) => {
                const strChkID = `chkDetail${intIndex}_${intDIdx}`
                const elDiv = document.createElement('div')
                elDiv.className = 'form-check mb-1'
                elDiv.innerHTML = `
                    <input class="form-check-input detail-checkbox" type="checkbox"
                        id="${strChkID}" data-detail-id="${objDetail.DetailID}"
                        aria-label="${objDetail.Description}">
                    <label class="form-check-label" for="${strChkID}">${objDetail.Description}</label>`
                elDetailContainer.appendChild(elDiv)
            })
        } else {
            elDetailContainer.innerHTML = '<p class="text-muted small">No details for this job yet.</p>'
        }

        elContainer.appendChild(elItem)
    })

    // AI: checking a job's top-level checkbox automatically checks or unchecks all its detail checkboxes
    elContainer.querySelectorAll('.job-checkbox').forEach((elChk) => {
        elChk.addEventListener('change', (evt) => {
            evt.stopPropagation()
            const strJobID = evt.target.dataset.jobId
            const blnChecked = evt.target.checked
            elContainer.querySelectorAll(`.detail-checkboxes[data-job-id="${strJobID}"] .detail-checkbox`).forEach((elDetail) => {
                elDetail.checked = blnChecked
            })
        })
    })
}

// AI: generic helper that renders a flat list of checkboxes for skills, certs, or awards into a given container
function renderSimpleSelection(strContainerID, arrItems, strPrefix, fnLabel, fnID) {
    const elContainer = document.getElementById(strContainerID)
    elContainer.innerHTML = ''
    if (!Array.isArray(arrItems) || arrItems.length < 1) {
        elContainer.innerHTML = '<p class="text-muted col-12">None added yet.</p>'
        return
    }
    arrItems.forEach((objItem, intIndex) => {
        const strChkID = `chk${strPrefix}${intIndex}`
        const elDiv = document.createElement('div')
        elDiv.className = 'col-md-6 col-lg-4'
        elDiv.innerHTML = `
            <div class="form-check">
                <input class="form-check-input ${strPrefix}-checkbox" type="checkbox"
                    id="${strChkID}" data-id="${fnID(objItem)}" aria-label="${fnLabel(objItem)}">
                <label class="form-check-label" for="${strChkID}">${fnLabel(objItem)}</label>
            </div>`
        elContainer.appendChild(elDiv)
    })
}

// AI: populates the target job dropdown from the loaded arrTargetJobs so the user can auto-fill the tailor textarea
function populateTargetJobDropdown() {
    const elSel = document.getElementById('selTargetJob')
    elSel.innerHTML = '<option value="">— Select a target job —</option>'
    if (Array.isArray(arrTargetJobs)) {
        arrTargetJobs.forEach((objJob) => {
            const elOpt = document.createElement('option')
            elOpt.value = objJob.TargetJobID
            elOpt.textContent = `${objJob.Title}${objJob.Company ? ' — ' + objJob.Company : ''}`
            elSel.appendChild(elOpt)
        })
    }
}

// ── Select / Deselect All ─────────────────────────────────────────────────────

// AI: sets every checkbox matching the given selector to the given checked state
function setAllChecked(strSelector, blnChecked) {
    document.querySelectorAll(strSelector).forEach((el) => { el.checked = blnChecked })
}

// ── Controls ──────────────────────────────────────────────────────────────────

// AI: wires up all Select All / Deselect All buttons, the Generate button, Print, Back, target job dropdown, and AI buttons
function initControls() {
    document.getElementById('btnSelectAllJobs').addEventListener('click', () => {
        setAllChecked('.job-checkbox', true)
        setAllChecked('.detail-checkbox', true)
    })
    document.getElementById('btnDeselectAllJobs').addEventListener('click', () => {
        setAllChecked('.job-checkbox', false)
        setAllChecked('.detail-checkbox', false)
    })
    document.getElementById('btnSelectAllSkills').addEventListener('click', () => setAllChecked('.skill-checkbox', true))
    document.getElementById('btnDeselectAllSkills').addEventListener('click', () => setAllChecked('.skill-checkbox', false))
    document.getElementById('btnSelectAllCerts').addEventListener('click', () => setAllChecked('.cert-checkbox', true))
    document.getElementById('btnDeselectAllCerts').addEventListener('click', () => setAllChecked('.cert-checkbox', false))
    document.getElementById('btnSelectAllAwards').addEventListener('click', () => setAllChecked('.award-checkbox', true))
    document.getElementById('btnDeselectAllAwards').addEventListener('click', () => setAllChecked('.award-checkbox', false))

    document.getElementById('btnGenerate').addEventListener('click', () => {
        if (!objProfile.Name || !objProfile.Email) {
            document.getElementById('divProfileWarning').classList.remove('d-none')
            return
        }
        document.getElementById('divProfileWarning').classList.add('d-none')
        generateResume()
    })

    document.getElementById('btnPrint').addEventListener('click', () => window.print())

    document.getElementById('btnBackToBuilder').addEventListener('click', () => {
        document.getElementById('divPreviewWrapper').classList.add('d-none')
        document.getElementById('divBuilderPanel').classList.remove('d-none')
    })

    // AI: when the user picks a saved target job, auto-fills the tailor textarea with its stored description
    document.getElementById('selTargetJob').addEventListener('change', (evt) => {
        const strID = evt.target.value
        if (!strID) return
        const objJob = arrTargetJobs.find((j) => j.TargetJobID === strID)
        if (objJob) document.getElementById('txaTailorDescription').value = objJob.Description
    })

    document.getElementById('btnTailor').addEventListener('click', tailorResume)
    document.getElementById('btnAutoFill').addEventListener('click', autoFillResume)
}

// ── Generate resume ───────────────────────────────────────────────────────────

// AI: orchestrates the full resume render — applies the chosen template class then calls each section renderer
function generateResume() {
    const strTemplate = document.querySelector('input[name="radTemplate"]:checked').value
    const elPreview = document.getElementById('divResumePreview')
    elPreview.className = `resume-preview template-${strTemplate}`

    renderResumeHeader()
    renderResumeSummary()
    renderResumeExperience()
    renderResumeSkills()
    renderResumeCerts()
    renderResumeAwards()

    document.getElementById('divTailorResult').classList.add('d-none')
    document.getElementById('divTailorAlert').classList.add('d-none')

    document.getElementById('divBuilderPanel').classList.add('d-none')
    document.getElementById('divPreviewWrapper').classList.remove('d-none')
    window.scrollTo(0, 0)
}

// AI: renders the name and contact line (email | phone | address) into the resume header
function renderResumeHeader() {
    document.getElementById('rName').textContent = objProfile.Name || ''
    const arrParts = [objProfile.Email, objProfile.Phone, objProfile.Address].filter(Boolean)
    document.getElementById('rContact').textContent = arrParts.join('  |  ')
}

// AI: renders the professional summary section, or hides it entirely if the profile has no summary
function renderResumeSummary() {
    const elSection = document.getElementById('rSummarySection')
    if (objProfile.Summary) {
        document.getElementById('rSummary').textContent = objProfile.Summary
        elSection.classList.remove('d-none')
    } else {
        elSection.classList.add('d-none')
    }
}

// AI: renders only the checked jobs and their checked detail bullets into the experience section
function renderResumeExperience() {
    const elSection = document.getElementById('rExperienceSection')
    const elContainer = document.getElementById('rExperienceItems')
    elContainer.innerHTML = ''

    const arrSelectedJobIDs = [...document.querySelectorAll('.job-checkbox:checked')].map((el) => el.dataset.jobId)
    const arrSelectedDetailIDs = [...document.querySelectorAll('.detail-checkbox:checked')].map((el) => el.dataset.detailId)
    const arrSelected = arrAllJobs.filter((j) => arrSelectedJobIDs.includes(j.JobID))

    if (arrSelected.length < 1) { elSection.classList.add('d-none'); return }
    elSection.classList.remove('d-none')

    arrSelected.forEach((objJob) => {
        const strStart = formatDate(objJob.StartDate)
        const strEnd = objJob.EndDate ? formatDate(objJob.EndDate) : 'Present'
        const strDates = strStart ? `${strStart} – ${strEnd}` : ''

        const elDiv = document.createElement('div')
        elDiv.className = 'mb-3'
        elDiv.innerHTML = `
            <div class="resume-job-title">${objJob.Title}</div>
            <div class="resume-job-meta">${objJob.Company}${strDates ? ' · ' + strDates : ''}</div>`

        const arrSelectedDetails = (objJob.arrDetails || []).filter((d) => arrSelectedDetailIDs.includes(d.DetailID))
        if (arrSelectedDetails.length > 0) {
            const elUl = document.createElement('ul')
            elUl.className = 'resume-job-details'
            arrSelectedDetails.forEach((objDetail) => {
                const elLi = document.createElement('li')
                elLi.textContent = objDetail.Description
                elUl.appendChild(elLi)
            })
            elDiv.appendChild(elUl)
        }
        elContainer.appendChild(elDiv)
    })
}

// AI: groups checked skills by category and renders each group as "Category: skill1, skill2, ..." lines
function renderResumeSkills() {
    const elSection = document.getElementById('rSkillsSection')
    const elContainer = document.getElementById('rSkillItems')
    elContainer.innerHTML = ''

    const arrSelectedIDs = [...document.querySelectorAll('.skill-checkbox:checked')].map((el) => el.dataset.id)
    const arrSelected = arrAllSkills.filter((s) => arrSelectedIDs.includes(s.SkillID))

    if (arrSelected.length < 1) { elSection.classList.add('d-none'); return }
    elSection.classList.remove('d-none')

    const objGrouped = {}
    arrSelected.forEach((objSkill) => {
        const strCat = objSkill.Category || 'General'
        if (!objGrouped[strCat]) objGrouped[strCat] = []
        objGrouped[strCat].push(objSkill.Name)
    })
    Object.keys(objGrouped).sort().forEach((strCategory) => {
        const elP = document.createElement('p')
        elP.className = 'mb-1'
        elP.innerHTML = `<strong>${strCategory}:</strong> ${objGrouped[strCategory].join(', ')}`
        elContainer.appendChild(elP)
    })
}

// AI: renders only the checked certifications as a bulleted list with issuer and year
function renderResumeCerts() {
    const elSection = document.getElementById('rCertsSection')
    const elList = document.getElementById('rCertItems')
    elList.innerHTML = ''

    const arrSelectedIDs = [...document.querySelectorAll('.cert-checkbox:checked')].map((el) => el.dataset.id)
    const arrSelected = arrAllCerts.filter((c) => arrSelectedIDs.includes(c.CertID))

    if (arrSelected.length < 1) { elSection.classList.add('d-none'); return }
    elSection.classList.remove('d-none')

    arrSelected.forEach((objCert) => {
        const elLi = document.createElement('li')
        elLi.textContent = `${objCert.Name}${objCert.Issuer ? ' — ' + objCert.Issuer : ''}${objCert.Year ? ' (' + objCert.Year + ')' : ''}`
        elList.appendChild(elLi)
    })
}

// AI: renders only the checked awards as a bulleted list with year and description
function renderResumeAwards() {
    const elSection = document.getElementById('rAwardsSection')
    const elList = document.getElementById('rAwardItems')
    elList.innerHTML = ''

    const arrSelectedIDs = [...document.querySelectorAll('.award-checkbox:checked')].map((el) => el.dataset.id)
    const arrSelected = arrAllAwards.filter((a) => arrSelectedIDs.includes(a.AwardID))

    if (arrSelected.length < 1) { elSection.classList.add('d-none'); return }
    elSection.classList.remove('d-none')

    arrSelected.forEach((objAward) => {
        const elLi = document.createElement('li')
        elLi.textContent = `${objAward.Name}${objAward.Year ? ' (' + objAward.Year + ')' : ''}${objAward.Description ? ' — ' + objAward.Description : ''}`
        elList.appendChild(elLi)
    })
}

// ── AI tailoring ──────────────────────────────────────────────────────────────
// AI: builds a plain-text snapshot of the selected resume and sends it alongside
//     the target job description to Gemini, which returns specific rewrite suggestions

// AI: assembles a plain-text resume snapshot from only the checked jobs, details, and skills
function buildResumeText() {
    const arrLines = []
    arrLines.push(objProfile.Name || '')
    if (objProfile.Summary) arrLines.push(`Summary: ${objProfile.Summary}`)

    const arrSelectedJobIDs = [...document.querySelectorAll('.job-checkbox:checked')].map((el) => el.dataset.jobId)
    const arrSelectedDetailIDs = [...document.querySelectorAll('.detail-checkbox:checked')].map((el) => el.dataset.detailId)

    arrAllJobs.filter((j) => arrSelectedJobIDs.includes(j.JobID)).forEach((objJob) => {
        arrLines.push(`\n${objJob.Title} at ${objJob.Company}`)
        ;(objJob.arrDetails || []).filter((d) => arrSelectedDetailIDs.includes(d.DetailID)).forEach((d) => {
            arrLines.push(`  - ${d.Description}`)
        })
    })

    const arrSelectedSkillIDs = [...document.querySelectorAll('.skill-checkbox:checked')].map((el) => el.dataset.id)
    const arrSkillNames = arrAllSkills.filter((s) => arrSelectedSkillIDs.includes(s.SkillID)).map((s) => s.Name)
    if (arrSkillNames.length > 0) arrLines.push(`\nSkills: ${arrSkillNames.join(', ')}`)

    return arrLines.join('\n')
}

// AI: sends the plain-text resume snapshot and job description to /api/ai/tailor and displays Gemini's suggestions
async function tailorResume() {
    const elResult = document.getElementById('divTailorResult')
    const elAlert = document.getElementById('divTailorAlert')
    elResult.classList.add('d-none')
    elAlert.classList.add('d-none')

    const strJobDescription = document.getElementById('txaTailorDescription').value.trim()
    if (strJobDescription.length < 1) {
        elAlert.className = 'alert alert-warning mt-3'
        elAlert.textContent = 'Please paste a job description first.'
        return
    }

    const elBtn = document.getElementById('btnTailor')
    elBtn.textContent = 'Getting suggestions...'
    elBtn.disabled = true

    const strResumeContent = buildResumeText()
    const objRes = await authUtils.fetchWithAuth('/api/ai/tailor', {
        method: 'POST',
        body: { resumeContent: strResumeContent, jobDescription: strJobDescription }
    })
    const arrData = await objRes.json()

    elBtn.textContent = 'Get Tailoring Suggestions'
    elBtn.disabled = false

    if (!objRes.ok) {
        elAlert.className = 'alert alert-warning mt-3'
        elAlert.textContent = arrData.message
        return
    }

    document.getElementById('divTailorText').textContent = arrData[0].suggestion
    elResult.classList.remove('d-none')
}

// ── AI auto-fill ──────────────────────────────────────────────────────────────
// AI: calls /api/ai/autofill with the current preview's summary + bullets and
//     the job description, then replaces the DOM text in place (no DB save)

// AI: collects the rendered summary and bullet text from the preview DOM and sends them to /api/ai/autofill for rewriting
async function autoFillResume() {
    const elBtn = document.getElementById('btnAutoFill')
    const elAlert = document.getElementById('divTailorAlert')
    elAlert.classList.add('d-none')

    const strJobDescription = document.getElementById('txaTailorDescription').value.trim()
    const strCurrentSummary = document.getElementById('rSummary').textContent.trim()
    const arrBulletEls = [...document.querySelectorAll('#rExperienceItems .resume-job-details li')]
    const arrBulletTexts = arrBulletEls.map((el) => el.textContent.trim())

    if (arrBulletTexts.length < 1 && !strCurrentSummary) {
        elAlert.className = 'alert alert-warning mt-3'
        elAlert.textContent = 'No resume content to rewrite. Generate a preview with jobs selected first.'
        return
    }

    elBtn.textContent = 'Applying...'
    elBtn.disabled = true

    const objRes = await authUtils.fetchWithAuth('/api/ai/autofill', {
        method: 'POST',
        body: { jobDescription: strJobDescription, summary: strCurrentSummary, bullets: arrBulletTexts }
    })
    const objData = await objRes.json()

    elBtn.textContent = 'Auto-Fill Resume'
    elBtn.disabled = false

    if (!objRes.ok) {
        elAlert.className = 'alert alert-warning mt-3'
        elAlert.textContent = objData.message || 'Auto-fill failed. Please try again.'
        return
    }

    // AI: updates the summary and bullet text directly in the preview DOM without saving to the database
    if (objData.summary && !document.getElementById('rSummarySection').classList.contains('d-none')) {
        document.getElementById('rSummary').textContent = objData.summary
    }

    if (Array.isArray(objData.bullets)) {
        arrBulletEls.forEach((elLi, intIdx) => {
            if (objData.bullets[intIdx]) elLi.textContent = objData.bullets[intIdx]
        })
    }
}
