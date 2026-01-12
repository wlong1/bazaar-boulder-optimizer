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
        const btn = e.target.closest('button');
        if (!btn) return;
        const uid = btn.dataset.uid;
        if (!uid) return;

        const removed = boardManager.removeByUid(uid);
        if (!removed) {
            return;
        }

        btn.remove();

        updateCounter(counterRoot, boardManager.getCount());
    });
}

export function addButton(listbox, instance) {
    const btn = document.createElement('button');
    btn.className = 'list-item';
    btn.textContent = instance.getName();
    btn.dataset.uid = instance._uid;
    listbox.appendChild(btn);
}

export function updateCounter(counter, n) {
    if (!counter) return;
    const span = counter.querySelector('#current-count');
    if (span) span.textContent = String(n);
}
