export function initControls(root, { baseItems, board, onBoardChange } = []) {
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
    initListSelection(itemsListSel, itemsListbox, itemsCounter, 20, {
        baseItems,
        board,
        onBoardChange
    });

    const skillsListSel = document.getElementById('skills');
    const skillsListbox = document.querySelector('.listbox.skills');
    initListSelection(skillsListSel, skillsListbox, null, 20, {});

};


function initListSelection(
    listSel,
    listbox,
    counterDisplay,
    maxSpace = 20,
    { baseItems, board, onBoardChange } = {}
) {
    const spaceDisplay = counterDisplay
        ? counterDisplay.querySelector('#current-count')
        : null;

    listSel.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li) return;

        const id = li.dataset.value;

        const baseItem = baseItems.find(i => i.getId() === id);
        if (!baseItem) return;

        if (spaceDisplay && board.length + 1 > maxSpace) return;

        const instance = baseItem.clone();
        board.push(instance);

        updateSpace(spaceDisplay, 1);
        onBoardChange(board);
    });
}


function updateSpace(counter, change) {
    if (counter) {
        counter.textContent = +counter.textContent + change;
    }
}