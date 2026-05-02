// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// targetjobs.js — Target jobs page logic
//
// Save, edit, and delete target job postings. Saved jobs appear in the Resume
// Builder's tailor dropdown so Gemini can cross-reference the resume against
// a specific job description.
// ─────────────────────────────────────────────────────────────────────────────

let strEditingTargetJobID = ''
let blnUnsavedChanges = false

// AI: verifies auth on page load, loads the target jobs list, and wires up the form and leave guard
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return
    await loadTargetJobs()
    initForm()
    initConfirmLeave()
})

// AI: fetches all saved target jobs from the API and renders them into the list, or shows the empty state
async function loadTargetJobs() {
    const objRes = await authUtils.fetchWithAuth('/api/targetjobs')
    const arrJobs = await objRes.json()

    const elList = document.getElementById('ulTargetJobList')
    const elNone = document.getElementById('pNoTargetJobs')
    elList.innerHTML = ''

    if (!Array.isArray(arrJobs) || arrJobs.length < 1) {
        elNone.classList.remove('d-none')
        return
    }
    elNone.classList.add('d-none')

    arrJobs.forEach((objJob) => {
        elList.appendChild(buildTargetJobItem(objJob))
    })
}

// AI: builds a single list item for a target job, truncating the description preview to 120 characters
function buildTargetJobItem(objJob) {
    const elLi = document.createElement('li')
    elLi.className = 'list-group-item'

    const strPreview = objJob.Description.length > 120
        ? objJob.Description.substring(0, 120) + '...'
        : objJob.Description

    elLi.innerHTML = `
        <div class="d-flex justify-content-between align-items-start gap-2">
            <div class="flex-grow-1">
                <div class="fw-semibold">${objJob.Title}${objJob.Company ? ' <span class="text-muted fw-normal">— ' + objJob.Company + '</span>' : ''}</div>
                <div class="text-muted small mt-1">${strPreview}</div>
            </div>
            <div class="d-flex gap-1 flex-shrink-0">
                <button class="btn btn-sm btn-outline-secondary" aria-label="Edit ${objJob.Title}">Edit</button>
                <button class="btn btn-sm btn-outline-danger" aria-label="Delete ${objJob.Title}">Delete</button>
            </div>
        </div>`

    const [elBtnEdit, elBtnDelete] = elLi.querySelectorAll('button')
    elBtnEdit.addEventListener('click', () => loadForEdit(objJob))
    elBtnDelete.addEventListener('click', () => deleteTargetJob(objJob.TargetJobID))
    return elLi
}

// AI: populates the form fields with the selected job's data and switches the form into edit mode
function loadForEdit(objJob) {
    strEditingTargetJobID = objJob.TargetJobID
    document.getElementById('hTargetJobFormTitle').textContent = 'Edit Target Job'
    document.getElementById('inpTargetTitle').value = objJob.Title
    document.getElementById('inpTargetCompany').value = objJob.Company || ''
    document.getElementById('txaTargetDescription').value = objJob.Description
    document.getElementById('btnSaveTargetJob').textContent = 'Save Changes'
    document.getElementById('btnCancelTargetJobEdit').classList.remove('d-none')
    document.getElementById('inpTargetTitle').focus()
}

// AI: clears the form and resets all state back to add mode
function resetForm() {
    strEditingTargetJobID = ''
    blnUnsavedChanges = false
    document.getElementById('hTargetJobFormTitle').textContent = 'Add a Target Job'
    document.getElementById('frmTargetJob').reset()
    document.getElementById('btnSaveTargetJob').textContent = 'Save Job'
    document.getElementById('btnCancelTargetJobEdit').classList.add('d-none')
    document.getElementById('divTargetJobAlert').className = 'alert d-none'
}

// AI: wires up the form's input, cancel, and submit handlers; submit sends POST or PUT depending on edit state
function initForm() {
    document.getElementById('frmTargetJob').addEventListener('input', () => { blnUnsavedChanges = true })
    document.getElementById('btnCancelTargetJobEdit').addEventListener('click', resetForm)

    document.getElementById('frmTargetJob').addEventListener('submit', async (evt) => {
        evt.preventDefault()
        const elAlert = document.getElementById('divTargetJobAlert')
        elAlert.className = 'alert d-none'

        const strTitle = document.getElementById('inpTargetTitle').value.trim()
        const strCompany = document.getElementById('inpTargetCompany').value.trim()
        const strDescription = document.getElementById('txaTargetDescription').value.trim()

        const strMethod = strEditingTargetJobID ? 'PUT' : 'POST'
        const strUrl = strEditingTargetJobID ? `/api/targetjobs/${strEditingTargetJobID}` : '/api/targetjobs'

        const objRes = await authUtils.fetchWithAuth(strUrl, {
            method: strMethod,
            body: { title: strTitle, company: strCompany, description: strDescription }
        })
        const objData = await objRes.json()

        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }

        resetForm()
        await loadTargetJobs()
    })
}

// AI: asks for confirmation then sends DELETE to the API and refreshes the list
async function deleteTargetJob(strTargetJobID) {
    if (!confirm('Delete this target job?')) return
    const objRes = await authUtils.fetchWithAuth(`/api/targetjobs/${strTargetJobID}`, { method: 'DELETE' })
    if (objRes.ok) await loadTargetJobs()
}

// AI: attaches the beforeunload handler to warn the user if they navigate away with unsaved form changes
function initConfirmLeave() {
    window.addEventListener('beforeunload', (evt) => {
        if (blnUnsavedChanges) {
            evt.preventDefault()
            evt.returnValue = ''
        }
    })
}
