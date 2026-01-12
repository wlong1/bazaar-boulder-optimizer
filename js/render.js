// render.js
export function createBoardRenderer({ boardManager, listboxRoot, spaceCounterRoot = null }) {
    if (!boardManager) throw new Error('boardManager required');
    const listbox = listboxRoot;
    const counterEl = spaceCounterRoot ? spaceCounterRoot.querySelector('#current-count') : null;

    function updateSpaceDisplay(board) {
        if (!counterEl) return;
        counterEl.textContent = board.length;
    }

    function render(board) {
        listbox.innerHTML = '';
        board.forEach((item, idx) => {
            const btn = document.createElement('button');
            btn.className = 'list-item';
            btn.textContent = item.getName();
            btn.dataset.index = idx;

            btn.addEventListener('click', () => {
                boardManager.removeAt(idx);
            });

            listbox.appendChild(btn);
        });
        updateSpaceDisplay(board);
    }

    const unsub = boardManager.subscribe(render);
    return { unsubscribe: unsub };
}