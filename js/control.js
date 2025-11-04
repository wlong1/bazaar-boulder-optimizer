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
};
