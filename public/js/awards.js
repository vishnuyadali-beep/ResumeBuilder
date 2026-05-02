// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// awards.js — Awards page logic
//
// Add, edit, and delete awards and honors. The form doubles as an edit form —
// clicking Edit on a list item populates the form and switches to update mode.
// ─────────────────────────────────────────────────────────────────────────────

let strEditingAwardID = ''
let blnUnsavedChanges = false

// AI: verifies auth on page load, fetches the award list, wires up the form, and guards against leaving with unsaved changes
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return
    await loadAwards()
    initAwardForm()
    window.addEventListener('beforeunload', (evt) => {
        if (blnUnsavedChanges) { evt.preventDefault(); evt.returnValue = '' }
    })
})

// AI: fetches all awards from the API and renders them into the list, or shows the empty state
async function loadAwards() {
    const objRes = await authUtils.fetchWithAuth('/api/awards')
    const arrAwards = await objRes.json()

    const elList = document.getElementById('ulAwardList')
    const elNone = document.getElementById('pNoAwards')
    elList.innerHTML = ''

    if (!Array.isArray(arrAwards) || arrAwards.length < 1) {
        elNone.classList.remove('d-none')
        return
    }
    elNone.classList.add('d-none')

    arrAwards.forEach((objAward) => {
        elList.appendChild(buildAwardItem(objAward))
    })
}

// AI: builds a single list item element for an award, including Edit and Delete buttons with their event listeners
function buildAwardItem(objAward) {
    const elLi = document.createElement('li')
    elLi.className = 'list-group-item d-flex justify-content-between align-items-start'
    elLi.innerHTML = `
        <div>
            <div class="fw-semibold">${objAward.Name}${objAward.Year ? ' <span class="text-muted fw-normal">(' + objAward.Year + ')</span>' : ''}</div>
            <div class="text-muted small">${objAward.Description || ''}</div>
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
            <button class="btn btn-sm btn-outline-secondary" aria-label="Edit ${objAward.Name}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" aria-label="Delete ${objAward.Name}">Delete</button>
        </div>`

    const [elBtnEdit, elBtnDelete] = elLi.querySelectorAll('button')
    elBtnEdit.addEventListener('click', () => loadAwardForEdit(objAward))
    elBtnDelete.addEventListener('click', () => deleteAward(objAward.AwardID))
    return elLi
}

// AI: populates the form fields with the selected award's data and switches the form into edit mode
function loadAwardForEdit(objAward) {
    strEditingAwardID = objAward.AwardID
    document.getElementById('hAwardFormTitle').textContent = 'Edit Award'
    document.getElementById('inpAwardName').value = objAward.Name
    document.getElementById('txaAwardDescription').value = objAward.Description || ''
    document.getElementById('inpAwardYear').value = objAward.Year || ''
    document.getElementById('btnSaveAward').textContent = 'Save Changes'
    document.getElementById('btnCancelAwardEdit').classList.remove('d-none')
    document.getElementById('inpAwardName').focus()
}

// AI: clears the form and resets all state back to add mode
function resetAwardForm() {
    strEditingAwardID = ''
    document.getElementById('hAwardFormTitle').textContent = 'Add an Award'
    document.getElementById('frmAward').reset()
    document.getElementById('btnSaveAward').textContent = 'Add Award'
    document.getElementById('btnCancelAwardEdit').classList.add('d-none')
    document.getElementById('divAwardAlert').className = 'alert d-none'
}

// AI: wires up the form's input, cancel, and submit handlers; submit sends POST or PUT depending on edit state
function initAwardForm() {
    document.getElementById('frmAward').addEventListener('input', () => { blnUnsavedChanges = true })
    document.getElementById('btnCancelAwardEdit').addEventListener('click', resetAwardForm)

    document.getElementById('frmAward').addEventListener('submit', async (evt) => {
        evt.preventDefault()
        const elAlert = document.getElementById('divAwardAlert')
        elAlert.className = 'alert d-none'

        const strName = document.getElementById('inpAwardName').value.trim()
        const strDescription = document.getElementById('txaAwardDescription').value.trim()
        const strYear = document.getElementById('inpAwardYear').value.trim()

        const strMethod = strEditingAwardID ? 'PUT' : 'POST'
        const strUrl = strEditingAwardID ? `/api/awards/${strEditingAwardID}` : '/api/awards'

        const objRes = await authUtils.fetchWithAuth(strUrl, {
            method: strMethod,
            body: { name: strName, description: strDescription, year: strYear }
        })
        const objData = await objRes.json()

        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }

        blnUnsavedChanges = false
        resetAwardForm()
        await loadAwards()
    })
}

// AI: asks for confirmation then sends DELETE to the API and refreshes the list
async function deleteAward(strAwardID) {
    if (!confirm('Delete this award?')) return
    const objRes = await authUtils.fetchWithAuth(`/api/awards/${strAwardID}`, { method: 'DELETE' })
    if (objRes.ok) await loadAwards()
}
