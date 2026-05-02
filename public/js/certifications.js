// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// certifications.js — Certifications page logic
//
// Add, edit, and delete certifications. The form doubles as an edit form —
// clicking Edit on a list item populates the form and switches to update mode.
// ─────────────────────────────────────────────────────────────────────────────

let strEditingCertID = ''
let blnUnsavedChanges = false

// AI: verifies auth on page load, fetches the certifications list, wires up the form, and guards against leaving with unsaved changes
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return
    await loadCerts()
    initCertForm()
    window.addEventListener('beforeunload', (evt) => {
        if (blnUnsavedChanges) { evt.preventDefault(); evt.returnValue = '' }
    })
})

// AI: fetches all certifications from the API and renders them into the list, or shows the empty state
async function loadCerts() {
    const objRes = await authUtils.fetchWithAuth('/api/certifications')
    const arrCerts = await objRes.json()

    const elList = document.getElementById('ulCertList')
    const elNone = document.getElementById('pNoCerts')
    elList.innerHTML = ''

    if (!Array.isArray(arrCerts) || arrCerts.length < 1) {
        elNone.classList.remove('d-none')
        return
    }
    elNone.classList.add('d-none')

    arrCerts.forEach((objCert) => {
        elList.appendChild(buildCertItem(objCert))
    })
}

// AI: builds a single list item element for a certification, including Edit and Delete buttons with their event listeners
function buildCertItem(objCert) {
    const elLi = document.createElement('li')
    elLi.className = 'list-group-item d-flex justify-content-between align-items-start'
    elLi.innerHTML = `
        <div>
            <div class="fw-semibold">${objCert.Name}</div>
            <div class="text-muted small">${objCert.Issuer || ''}${objCert.Year ? ' · ' + objCert.Year : ''}</div>
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
            <button class="btn btn-sm btn-outline-secondary" aria-label="Edit ${objCert.Name}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" aria-label="Delete ${objCert.Name}">Delete</button>
        </div>`

    const [elBtnEdit, elBtnDelete] = elLi.querySelectorAll('button')
    elBtnEdit.addEventListener('click', () => loadCertForEdit(objCert))
    elBtnDelete.addEventListener('click', () => deleteCert(objCert.CertID))
    return elLi
}

// AI: populates the form fields with the selected certification's data and switches the form into edit mode
function loadCertForEdit(objCert) {
    strEditingCertID = objCert.CertID
    document.getElementById('hCertFormTitle').textContent = 'Edit Certification'
    document.getElementById('inpCertName').value = objCert.Name
    document.getElementById('inpCertIssuer').value = objCert.Issuer || ''
    document.getElementById('inpCertYear').value = objCert.Year || ''
    document.getElementById('btnSaveCert').textContent = 'Save Changes'
    document.getElementById('btnCancelCertEdit').classList.remove('d-none')
    document.getElementById('inpCertName').focus()
}

// AI: clears the form and resets all state back to add mode
function resetCertForm() {
    strEditingCertID = ''
    document.getElementById('hCertFormTitle').textContent = 'Add a Certification'
    document.getElementById('frmCert').reset()
    document.getElementById('btnSaveCert').textContent = 'Add Certification'
    document.getElementById('btnCancelCertEdit').classList.add('d-none')
    document.getElementById('divCertAlert').className = 'alert d-none'
}

// AI: wires up the form's input, cancel, and submit handlers; submit sends POST or PUT depending on edit state
function initCertForm() {
    document.getElementById('frmCert').addEventListener('input', () => { blnUnsavedChanges = true })
    document.getElementById('btnCancelCertEdit').addEventListener('click', resetCertForm)

    document.getElementById('frmCert').addEventListener('submit', async (evt) => {
        evt.preventDefault()
        const elAlert = document.getElementById('divCertAlert')
        elAlert.className = 'alert d-none'

        const strName = document.getElementById('inpCertName').value.trim()
        const strIssuer = document.getElementById('inpCertIssuer').value.trim()
        const strYear = document.getElementById('inpCertYear').value.trim()

        const strMethod = strEditingCertID ? 'PUT' : 'POST'
        const strUrl = strEditingCertID ? `/api/certifications/${strEditingCertID}` : '/api/certifications'

        const objRes = await authUtils.fetchWithAuth(strUrl, {
            method: strMethod,
            body: { name: strName, issuer: strIssuer, year: strYear }
        })
        const objData = await objRes.json()

        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }

        blnUnsavedChanges = false
        resetCertForm()
        await loadCerts()
    })
}

// AI: asks for confirmation then sends DELETE to the API and refreshes the list
async function deleteCert(strCertID) {
    if (!confirm('Delete this certification?')) return
    const objRes = await authUtils.fetchWithAuth(`/api/certifications/${strCertID}`, { method: 'DELETE' })
    if (objRes.ok) await loadCerts()
}
