// ─────────────────────────────────────────────────────────────────────────────
// Resume Builder — Generated with Claude Code (Anthropic)
// ─────────────────────────────────────────────────────────────────────────────
// skills.js — Skills page logic
//
// Add, edit, and delete skills. Skills are grouped by category in the list.
// The AI suggest button sends the skill name to Gemini which returns a
// professional phrasing and suggested category in "Name: X | Category: Y" format.
// ─────────────────────────────────────────────────────────────────────────────

let strEditingSkillID = ''
let blnUnsavedChanges = false

// AI: verifies auth on page load, loads the skill list, wires up the form, and guards against leaving with unsaved changes
document.addEventListener('DOMContentLoaded', async () => {
    if (!authUtils.requireAuth()) return
    await loadSkills()
    initSkillForm()
    window.addEventListener('beforeunload', (evt) => {
        if (blnUnsavedChanges) { evt.preventDefault(); evt.returnValue = '' }
    })
})

// AI: fetches all skills from the API, groups them by category, and renders each group as a labelled section
async function loadSkills() {
    const objRes = await authUtils.fetchWithAuth('/api/skills')
    const arrSkills = await objRes.json()

    const elContainer = document.getElementById('divSkillList')
    const elNone = document.getElementById('pNoSkills')
    elContainer.innerHTML = ''

    if (!Array.isArray(arrSkills) || arrSkills.length < 1) {
        elNone.classList.remove('d-none')
        return
    }
    elNone.classList.add('d-none')

    const objGrouped = {}
    arrSkills.forEach((objSkill) => {
        const strCat = objSkill.Category || 'General'
        if (!objGrouped[strCat]) objGrouped[strCat] = []
        objGrouped[strCat].push(objSkill)
    })

    Object.keys(objGrouped).sort().forEach((strCategory) => {
        const elSection = document.createElement('div')
        elSection.className = 'border-bottom pb-2 pt-3 px-3'
        elSection.innerHTML = `<h6 class="text-muted text-uppercase small mb-2">${strCategory}</h6>`
        const elList = document.createElement('ul')
        elList.className = 'list-group list-group-flush'
        objGrouped[strCategory].forEach((objSkill) => { elList.appendChild(buildSkillItem(objSkill)) })
        elSection.appendChild(elList)
        elContainer.appendChild(elSection)
    })
}

// AI: builds a single list item for a skill with Edit and Delete buttons and their event listeners
function buildSkillItem(objSkill) {
    const elLi = document.createElement('li')
    elLi.className = 'list-group-item d-flex justify-content-between align-items-center'
    elLi.innerHTML = `
        <span>${objSkill.Name}</span>
        <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary" aria-label="Edit ${objSkill.Name}">Edit</button>
            <button class="btn btn-sm btn-outline-danger" aria-label="Delete ${objSkill.Name}">Delete</button>
        </div>`
    const [elBtnEdit, elBtnDelete] = elLi.querySelectorAll('button')
    elBtnEdit.addEventListener('click', () => loadSkillForEdit(objSkill))
    elBtnDelete.addEventListener('click', () => deleteSkill(objSkill.SkillID))
    return elLi
}

// AI: populates the form fields with the selected skill's data and switches the form into edit mode
function loadSkillForEdit(objSkill) {
    strEditingSkillID = objSkill.SkillID
    document.getElementById('hSkillFormTitle').textContent = 'Edit Skill'
    document.getElementById('inpSkillName').value = objSkill.Name
    document.getElementById('inpSkillCategory').value = objSkill.Category || ''
    document.getElementById('btnSaveSkill').textContent = 'Save Changes'
    document.getElementById('btnCancelSkillEdit').classList.remove('d-none')
    document.getElementById('inpSkillName').focus()
}

// AI: clears the form, hides the AI suggestion panel, and resets all state back to add mode
function resetSkillForm() {
    strEditingSkillID = ''
    blnUnsavedChanges = false
    document.getElementById('hSkillFormTitle').textContent = 'Add a Skill'
    document.getElementById('frmSkill').reset()
    document.getElementById('btnSaveSkill').textContent = 'Add Skill'
    document.getElementById('btnCancelSkillEdit').classList.add('d-none')
    document.getElementById('divSkillAlert').className = 'alert d-none'
    document.getElementById('divSkillAISuggestion').classList.add('d-none')
}

// AI: wires up all form handlers — input tracking, cancel, AI suggest button, apply/dismiss suggestion, and submit
function initSkillForm() {
    document.getElementById('frmSkill').addEventListener('input', () => { blnUnsavedChanges = true })
    document.getElementById('btnCancelSkillEdit').addEventListener('click', resetSkillForm)

    // AI: sends the skill name to Gemini which returns a professional phrasing and suggested category
    document.getElementById('btnSkillAISuggest').addEventListener('click', async () => {
        const strText = document.getElementById('inpSkillName').value.trim()
        const elAlert = document.getElementById('divSkillAlert')
        if (strText.length < 1) {
            elAlert.className = 'alert alert-warning'
            elAlert.textContent = 'Enter a skill name first.'
            return
        }
        const elBtn = document.getElementById('btnSkillAISuggest')
        elBtn.textContent = 'Loading...'
        elBtn.disabled = true

        const objRes = await authUtils.fetchWithAuth('/api/ai/suggest', {
            method: 'POST',
            body: { text: strText, context: 'skill name for a resume — suggest the most professional phrasing and the best category (e.g. Programming Languages, Frameworks, Tools, Soft Skills). Reply in this format: Name: [name] | Category: [category]' }
        })
        const arrData = await objRes.json()
        elBtn.textContent = 'AI Suggest'
        elBtn.disabled = false

        if (!objRes.ok) {
            elAlert.className = 'alert alert-warning'
            elAlert.textContent = arrData.message
            return
        }

        document.getElementById('pSkillSuggestionText').textContent = arrData[0].suggestion
        document.getElementById('divSkillAISuggestion').classList.remove('d-none')
    })

    // AI: parses the "Name: X | Category: Y" response format and applies each part to the correct form field
    document.getElementById('btnApplySkillSuggestion').addEventListener('click', () => {
        const strSuggestion = document.getElementById('pSkillSuggestionText').textContent
        const strNameMatch = strSuggestion.match(/Name:\s*([^|]+)/i)
        const strCatMatch = strSuggestion.match(/Category:\s*(.+)/i)
        if (strNameMatch) document.getElementById('inpSkillName').value = strNameMatch[1].trim()
        if (strCatMatch) document.getElementById('inpSkillCategory').value = strCatMatch[1].trim()
        document.getElementById('divSkillAISuggestion').classList.add('d-none')
    })

    document.getElementById('btnDismissSkillSuggestion').addEventListener('click', () => {
        document.getElementById('divSkillAISuggestion').classList.add('d-none')
    })

    // AI: submits the form as POST or PUT depending on whether a skill is being edited
    document.getElementById('frmSkill').addEventListener('submit', async (evt) => {
        evt.preventDefault()
        const elAlert = document.getElementById('divSkillAlert')
        elAlert.className = 'alert d-none'

        const strName = document.getElementById('inpSkillName').value.trim()
        const strCategory = document.getElementById('inpSkillCategory').value.trim()

        const strMethod = strEditingSkillID ? 'PUT' : 'POST'
        const strUrl = strEditingSkillID ? `/api/skills/${strEditingSkillID}` : '/api/skills'

        const objRes = await authUtils.fetchWithAuth(strUrl, {
            method: strMethod,
            body: { name: strName, category: strCategory }
        })
        const objData = await objRes.json()

        if (!objRes.ok) {
            elAlert.className = 'alert alert-danger'
            elAlert.textContent = objData.message
            return
        }
        resetSkillForm()
        await loadSkills()
    })
}

// AI: asks for confirmation then sends DELETE to the API and refreshes the list
async function deleteSkill(strSkillID) {
    if (!confirm('Delete this skill?')) return
    const objRes = await authUtils.fetchWithAuth(`/api/skills/${strSkillID}`, { method: 'DELETE' })
    if (objRes.ok) await loadSkills()
}
