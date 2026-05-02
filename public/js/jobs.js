// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// jobs.js — Jobs page logic
//
// Manages the two-panel layout: a job list on the left and a detail/form panel
// on the right. Users can add, edit, and delete jobs and their individual
// responsibility bullet points. Each bullet point also supports AI suggestions
// via the Gemini API proxy at /api/ai/suggest.
// ─────────────────────────────────────────────────────────────────────────────

let strCurrentJobID = ''
let blnEditingJob = false
let blnUnsavedChanges = false

// AI: verifies auth on page load, loads the job list, wires up all handlers, and guards against leaving with unsaved changes
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return
    await loadJobs()
    initJobForm()
    initDetailHandlers()
    window.addEventListener('beforeunload', (evt) => {
        if (blnUnsavedChanges) { evt.preventDefault(); evt.returnValue = '' }
    })
})

// ── Jobs — fetch list and render sidebar ─────────────────────────────────────

// AI: fetches all jobs from the API and renders each as a clickable sidebar button
async function loadJobs() {
    const objRes = await authUtils.fetchWithAuth('/api/jobs')
    const arrJobs = await objRes.json()

    const elList = document.getElementById('divJobList')
    const elNoJobs = document.getElementById('pNoJobs')
    elList.innerHTML = ''

    if (!Array.isArray(arrJobs) || arrJobs.length < 1) {
        elNoJobs.classList.remove('d-none')
        return
    }
    elNoJobs.classList.add('d-none')

    arrJobs.forEach((objJob) => {
        const elItem = document.createElement('button')
        elItem.type = 'button'
        elItem.className = 'list-group-item list-group-item-action'
        elItem.setAttribute('role', 'listitem')
        elItem.setAttribute('aria-label', `${objJob.Title} at ${objJob.Company}`)
        elItem.innerHTML = `
            <div class="fw-semibold">${objJob.Title}</div>
            <div class="text-muted small">${objJob.Company}</div>`
        elItem.addEventListener('click', () => selectJob(objJob))
        elList.appendChild(elItem)
    })
}

// AI: switches the right panel to show the selected job's details and loads its responsibility bullet points
function selectJob(objJob) {
    strCurrentJobID = objJob.JobID
    hideJobForm()
    document.getElementById('divSelectPrompt').classList.add('d-none')
    document.getElementById('divJobDetails').classList.remove('d-none')
    document.getElementById('hDetailJobTitle').textContent = `${objJob.Title} — ${objJob.Company}`
    const strEnd = objJob.EndDate ? objJob.EndDate : 'Present'
    document.getElementById('spnDetailJobDates').textContent = objJob.StartDate ? `${objJob.StartDate} – ${strEnd}` : ''
    document.getElementById('btnEditJob').onclick = () => showJobForm(objJob)
    document.getElementById('btnDeleteJob').onclick = () => deleteJob(objJob.JobID)
    loadJobDetails(objJob.JobID)
}

// AI: shows the job form pre-populated for editing, or blank for adding a new job
function showJobForm(objJob = null) {
    blnEditingJob = objJob !== null
    document.getElementById('divJobForm').classList.remove('d-none')
    document.getElementById('divJobDetails').classList.add('d-none')
    document.getElementById('divSelectPrompt').classList.add('d-none')
    document.getElementById('hJobFormTitle').textContent = blnEditingJob ? 'Edit Job' : 'Add New Job'
    document.getElementById('divJobAlert').className = 'alert d-none'
    document.getElementById('chkCurrentJob').checked = false
    document.getElementById('inpEndDate').disabled = false

    if (blnEditingJob) {
        document.getElementById('inpJobTitle').value = objJob.Title
        document.getElementById('inpCompany').value = objJob.Company
        document.getElementById('inpStartDate').value = objJob.StartDate || ''
        if (!objJob.EndDate) {
            document.getElementById('chkCurrentJob').checked = true
            document.getElementById('inpEndDate').disabled = true
            document.getElementById('inpEndDate').value = ''
        } else {
            document.getElementById('inpEndDate').value = objJob.EndDate
        }
        document.getElementById('frmJob').dataset.jobId = objJob.JobID
    } else {
        document.getElementById('frmJob').reset()
        delete document.getElementById('frmJob').dataset.jobId
    }
}

// AI: hides the job form and clears the unsaved changes flag
function hideJobForm() {
    document.getElementById('divJobForm').classList.add('d-none')
    blnUnsavedChanges = false
}

// AI: wires up the New Job button, form input tracking, cancel button, current-job checkbox, and form submit
function initJobForm() {
    document.getElementById('btnNewJob').addEventListener('click', () => showJobForm())
    document.getElementById('frmJob').addEventListener('input', () => { blnUnsavedChanges = true })

    document.getElementById('btnCancelJobForm').addEventListener('click', () => {
        hideJobForm()
        if (strCurrentJobID) {
            document.getElementById('divJobDetails').classList.remove('d-none')
        } else {
            document.getElementById('divSelectPrompt').classList.remove('d-none')
        }
    })

    document.getElementById('chkCurrentJob').addEventListener('change', (evt) => {
        const elEndDate = document.getElementById('inpEndDate')
        elEndDate.disabled = evt.target.checked
        if (evt.target.checked) elEndDate.value = ''
    })

    document.getElementById('frmJob').addEventListener('submit', async (evt) => {
        evt.preventDefault()
        const elAlert = document.getElementById('divJobAlert')
        elAlert.className = 'alert d-none'

        const strTitle = document.getElementById('inpJobTitle').value.trim()
        const strCompany = document.getElementById('inpCompany').value.trim()
        const strStartDate = document.getElementById('inpStartDate').value
        const blnCurrentJob = document.getElementById('chkCurrentJob').checked
        const strEndDate = blnCurrentJob ? '' : document.getElementById('inpEndDate').value

        const strJobID = document.getElementById('frmJob').dataset.jobId
        const strMethod = strJobID ? 'PUT' : 'POST'
        const strUrl = strJobID ? `/api/jobs/${strJobID}` : '/api/jobs'

        const objRes = await authUtils.fetchWithAuth(strUrl, {
            method: strMethod,
            body: { title: strTitle, company: strCompany, startDate: strStartDate, endDate: strEndDate }
        })
        const objData = await objRes.json()

        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }

        blnUnsavedChanges = false
        hideJobForm()
        await loadJobs()

        if (!strJobID) {
            strCurrentJobID = ''
            document.getElementById('divSelectPrompt').classList.remove('d-none')
            document.getElementById('divJobDetails').classList.add('d-none')
        } else {
            document.getElementById('divJobDetails').classList.remove('d-none')
            document.getElementById('hDetailJobTitle').textContent = `${strTitle} — ${strCompany}`
        }
    })
}

// AI: asks for confirmation then deletes the job and resets the right panel to the empty prompt
async function deleteJob(strJobID) {
    if (!confirm('Delete this job and all its details?')) return
    const objRes = await authUtils.fetchWithAuth(`/api/jobs/${strJobID}`, { method: 'DELETE' })
    if (objRes.ok) {
        strCurrentJobID = ''
        document.getElementById('divJobDetails').classList.add('d-none')
        document.getElementById('divSelectPrompt').classList.remove('d-none')
        await loadJobs()
    }
}

// ── Job Details — responsibility bullet points ────────────────────────────────

// AI: fetches all responsibility bullet points for the selected job and renders them into the detail list
async function loadJobDetails(strJobID) {
    const objRes = await authUtils.fetchWithAuth(`/api/jobs/${strJobID}/details`)
    const arrDetails = await objRes.json()

    const elList = document.getElementById('ulDetailList')
    const elNone = document.getElementById('pNoDetails')
    elList.innerHTML = ''
    document.getElementById('divDetailAlert').className = 'alert d-none'
    document.getElementById('txaNewDetail').value = ''
    document.getElementById('divAISuggestion').classList.add('d-none')

    if (!Array.isArray(arrDetails) || arrDetails.length < 1) {
        elNone.classList.remove('d-none')
        return
    }
    elNone.classList.add('d-none')
    arrDetails.forEach((objDetail) => { elList.appendChild(buildDetailItem(objDetail)) })
}

// AI: builds a single list item for a responsibility with an inline edit area that includes its own AI suggest button
function buildDetailItem(objDetail) {
    const elLi = document.createElement('li')
    elLi.className = 'list-group-item'
    elLi.setAttribute('data-detail-id', objDetail.DetailID)

    elLi.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2">
            <p class="mb-0 flex-grow-1 detail-text">${objDetail.Description}</p>
            <div class="d-flex gap-1 flex-shrink-0">
                <button class="btn btn-sm btn-outline-secondary" aria-label="Edit this detail">Edit</button>
                <button class="btn btn-sm btn-outline-danger" aria-label="Delete this detail">Delete</button>
            </div>
        </div>
        <div class="edit-area mt-2 d-none">
            <textarea class="form-control form-control-sm mb-1" rows="2" aria-label="Edit responsibility text">${objDetail.Description}</textarea>
            <div class="d-flex gap-1 flex-wrap">
                <button class="btn btn-sm btn-primary save-edit-btn" aria-label="Save edit">Save</button>
                <button class="btn btn-sm btn-outline-secondary" id="btnEditAISuggest_${objDetail.DetailID}" aria-label="Get AI suggestion for this detail">AI Suggest</button>
                <button class="btn btn-sm btn-secondary cancel-edit-btn" aria-label="Cancel edit">Cancel</button>
            </div>
            <div class="edit-ai-panel alert alert-info mt-2 d-none" role="region" aria-label="AI suggestion for edit">
                <strong>AI Suggestion:</strong>
                <p class="edit-suggestion-text mb-2 mt-1"></p>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-success apply-edit-suggestion-btn" aria-label="Apply suggestion">Apply</button>
                    <button class="btn btn-sm btn-outline-secondary dismiss-edit-suggestion-btn" aria-label="Dismiss suggestion">Dismiss</button>
                </div>
            </div>
        </div>`

    const [elBtnEdit, elBtnDelete] = elLi.querySelectorAll(':scope > div > div > button')
    const elEditArea = elLi.querySelector('.edit-area')
    const elText = elLi.querySelector('.detail-text')
    const elTxa = elLi.querySelector('textarea')
    const elAIPanel = elLi.querySelector('.edit-ai-panel')

    // AI: toggles the inline edit area open and closed without leaving the page
    elBtnEdit.addEventListener('click', () => {
        elEditArea.classList.toggle('d-none')
        elText.classList.toggle('d-none')
    })
    elBtnDelete.addEventListener('click', () => deleteDetail(objDetail.DetailID, elLi))

    elLi.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        elEditArea.classList.add('d-none')
        elText.classList.remove('d-none')
        elAIPanel.classList.add('d-none')
    })

    // AI: saves the edited text to the API and updates the visible paragraph in place without a full reload
    elLi.querySelector('.save-edit-btn').addEventListener('click', async () => {
        const strNewDesc = elTxa.value.trim()
        if (!strNewDesc) return
        const objRes = await authUtils.fetchWithAuth(`/api/jobs/${strCurrentJobID}/details/${objDetail.DetailID}`, {
            method: 'PUT',
            body: { description: strNewDesc }
        })
        if (objRes.ok) {
            elText.textContent = strNewDesc
            objDetail.Description = strNewDesc
            elTxa.value = strNewDesc
            elEditArea.classList.add('d-none')
            elText.classList.remove('d-none')
            elAIPanel.classList.add('d-none')
        }
    })

    // AI: same Gemini suggestion flow applied to existing saved details during editing
    elLi.querySelector(`#btnEditAISuggest_${objDetail.DetailID}`).addEventListener('click', async (evt) => {
        const strText = elTxa.value.trim()
        if (strText.length < 1) return
        evt.target.textContent = 'Loading...'
        evt.target.disabled = true

        const objRes = await authUtils.fetchWithAuth('/api/ai/suggest', {
            method: 'POST',
            body: { text: strText, context: 'job responsibility for a resume' }
        })
        const arrData = await objRes.json()
        evt.target.textContent = 'AI Suggest'
        evt.target.disabled = false

        if (!objRes.ok) return
        elLi.querySelector('.edit-suggestion-text').textContent = arrData[0].suggestion
        elAIPanel.classList.remove('d-none')
    })

    // AI: copies the suggestion text into the textarea so the user can review it before saving
    elLi.querySelector('.apply-edit-suggestion-btn').addEventListener('click', () => {
        elTxa.value = elLi.querySelector('.edit-suggestion-text').textContent
        elAIPanel.classList.add('d-none')
    })
    elLi.querySelector('.dismiss-edit-suggestion-btn').addEventListener('click', () => {
        elAIPanel.classList.add('d-none')
    })

    return elLi
}

// AI: asks for confirmation then removes the detail element from the DOM and hides the list if it is now empty
async function deleteDetail(strDetailID, elLi) {
    if (!confirm('Delete this detail?')) return
    const objRes = await authUtils.fetchWithAuth(`/api/jobs/${strCurrentJobID}/details/${strDetailID}`, { method: 'DELETE' })
    if (objRes.ok) {
        elLi.remove()
        if (document.getElementById('ulDetailList').children.length < 1) {
            document.getElementById('pNoDetails').classList.remove('d-none')
        }
    }
}

// AI: wires up the Add Detail button, the AI suggest button for new details, and the apply/dismiss suggestion buttons
function initDetailHandlers() {
    document.getElementById('btnAddDetail').addEventListener('click', async () => {
        const elAlert = document.getElementById('divDetailAlert')
        elAlert.className = 'alert d-none'
        const strDescription = document.getElementById('txaNewDetail').value.trim()
        if (!strCurrentJobID) return
        if (strDescription.length < 1) {
            elAlert.className = 'alert alert-warning'
            elAlert.textContent = 'Please enter a description.'
            return
        }
        const objRes = await authUtils.fetchWithAuth(`/api/jobs/${strCurrentJobID}/details`, {
            method: 'POST',
            body: { description: strDescription }
        })
        const objData = await objRes.json()
        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }
        document.getElementById('txaNewDetail').value = ''
        document.getElementById('divAISuggestion').classList.add('d-none')
        document.getElementById('pNoDetails').classList.add('d-none')
        document.getElementById('ulDetailList').appendChild(
            buildDetailItem({ DetailID: objData.detailID, Description: strDescription })
        )
    })

    // AI: sends the typed detail to Gemini and displays the improved version for the user to accept or dismiss
    document.getElementById('btnGetSuggestion').addEventListener('click', async () => {
        const strText = document.getElementById('txaNewDetail').value.trim()
        const elAlert = document.getElementById('divDetailAlert')
        if (strText.length < 1) {
            elAlert.className = 'alert alert-warning'
            elAlert.textContent = 'Enter some text before requesting a suggestion.'
            return
        }
        document.getElementById('btnGetSuggestion').textContent = 'Loading...'
        document.getElementById('btnGetSuggestion').disabled = true

        const objRes = await authUtils.fetchWithAuth('/api/ai/suggest', {
            method: 'POST',
            body: { text: strText, context: 'job responsibility for a resume' }
        })
        const arrData = await objRes.json()
        document.getElementById('btnGetSuggestion').textContent = 'Get AI Suggestion'
        document.getElementById('btnGetSuggestion').disabled = false

        if (!objRes.ok) {
            elAlert.className = 'alert alert-warning'
            elAlert.textContent = arrData.message
            return
        }
        document.getElementById('pSuggestionText').textContent = arrData[0].suggestion
        document.getElementById('divAISuggestion').classList.remove('d-none')
    })

    // AI: copies the suggestion into the textarea so the user can review it before clicking Add Detail
    document.getElementById('btnApplySuggestion').addEventListener('click', () => {
        document.getElementById('txaNewDetail').value = document.getElementById('pSuggestionText').textContent
        document.getElementById('divAISuggestion').classList.add('d-none')
    })
    document.getElementById('btnDismissSuggestion').addEventListener('click', () => {
        document.getElementById('divAISuggestion').classList.add('d-none')
    })
}
