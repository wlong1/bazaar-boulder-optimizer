document.addEventListener('DOMContentLoaded', () => {
    const btnItems = document.querySelector('#control-items');
    const btnSkills = document.querySelector('#control-skills');
    const panelItems = document.querySelector('#control-items-panel');
    const panelSkills = document.querySelector('#control-skills-panel');

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
});
