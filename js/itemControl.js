export function populateList(list, itemsData) {
    list.innerHTML = '';

    for (const item of itemsData) {
        const li = document.createElement('li');
        li.dataset.value = item.id;
        li.textContent = item.name;
        list.appendChild(li);
    }
}