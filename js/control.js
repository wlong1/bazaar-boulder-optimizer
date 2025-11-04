export function initControls(root) {
    const btnItems = root.querySelector('#control-items');
    const btnSkills = root.querySelector('#control-skills');
    const panelItems = root.querySelector('#control-items-panel');
    const panelSkills = root.querySelector('#control-skills-panel');

    function toggleView(showList, hideList, activeBtn, inactiveBtn) {
        showList.classList.remove('hidden');
        hideList.classList.add('hidden');
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
    }

    btnItems.addEventListener('click', () => {
        toggleView(panelItems, panelSkills, btnItems, btnSkills);
    });

    btnSkills.addEventListener('click', () => {
        toggleView(panelSkills, panelItems, btnSkills, btnItems);
    });


    // Items and skills panel
    const itemsListSel = document.getElementById('items');
    const itemsListbox = document.querySelector('.listbox.items');
    const itemsCounter = document.querySelector('.space-counter');
    initListSelection(itemsListSel, itemsListbox, itemsCounter, 20);

    const skillsListSel = document.getElementById('skills');
    const skillsListbox = document.querySelector('.listbox.skills');
    initListSelection(skillsListSel, skillsListbox, null, 20);

};


function initListSelection(listSel, listbox, counterDisplay, maxSpace = 20) {
    const spaceDisplay = counterDisplay ? counterDisplay.querySelector('#current-count') : null;

    listSel.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li) return;

        const value = li.dataset.value;
        const text = li.textContent;

        const existingBtn = listbox.querySelector(`button[value="${value}"]`);
        if (existingBtn) {
            existingBtn.remove();
            updateSpace(spaceDisplay, -1);
        } else {
            if (spaceDisplay) {
                const currentSpace = +spaceDisplay.textContent;
                if (currentSpace + 1 > maxSpace) return;
            }

            const btn = document.createElement('button');
            btn.className = listbox.classList.contains('skills') ? 'list-skill' : 'list-item';
            btn.value = value;
            btn.textContent = text;
            listbox.appendChild(btn);

            updateSpace(spaceDisplay, 1);
        }
    });
}


function updateSpace(counter, change) {
    if (counter) {
        counter.textContent = +counter.textContent + change;
    }
}