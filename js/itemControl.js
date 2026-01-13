export function populateList(list, baseItems) {
    list.innerHTML = '';
    for (const item of baseItems) {
        const li = document.createElement('li');
        li.dataset.value = item.getId();
        li.textContent = item.getName();
        list.appendChild(li);
    }
}

export function buildBoardAdd(listRoot, {
    baseItems,
    boardManager,
    listboxRoot,
    counterRoot,
    maxSpace = 20
}) {
    listRoot.addEventListener('click', e => {
        const li = e.target.closest('li');
        if (!li) return;
        const id = li.dataset.value;
        const base = baseItems.find(b => String(b.getId()) === String(id));
        if (!base) return;

        const instance = boardManager.addClone(base, { maxSpace });
        if (!instance) {
            return;
        }

        addButton(listboxRoot, instance);
        updateCounter(counterRoot, boardManager.getCount());
    });
}

export function buildBoardRemove(listboxRoot, { boardManager, counterRoot }) {
    listboxRoot.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const container = removeBtn.closest('.list-item');
            if (!container) return;
            const uid = container.dataset.uid;
            if (!uid) return;

            const removed = boardManager.removeByUid(uid);
            if (!removed) {
                return;
            }

            container.remove();
            updateCounter(counterRoot, boardManager.getCount());
            return;
        }

        const itemBtn = e.target.closest('.list-item-btn');
        if (itemBtn) {
            const container = itemBtn.closest('.list-item');
            if (!container) return;
            const uid = container.dataset.uid;
            if (!uid) return;


            const item = boardManager.getByUid(uid);

            selectItem(item, uid);
        }
    });
}

function selectItem(){
    return;
}

export function addButton(listbox, instance) {
    const container = document.createElement('div');
    container.className = 'list-item';
    container.dataset.uid = instance._uid;

    const itemBtn = document.createElement('button');
    itemBtn.className = 'list-item-btn';
    itemBtn.type = 'button';
    itemBtn.textContent = instance.getName();

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.type = 'button';
    removeBtn.setAttribute('aria-label', 'Remove item');
    removeBtn.innerHTML = '&times;'; // "x"

    container.appendChild(itemBtn);
    container.appendChild(removeBtn);

    listbox.appendChild(container);
}

export function updateCounter(counter, n) {
    if (!counter) return;
    const span = counter.querySelector('#current-count');
    if (span) span.textContent = String(n);
}
