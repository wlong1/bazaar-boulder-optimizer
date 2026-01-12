import { loadItems } from './itemFactory.js';
import { populateList, buildBoardAdd, buildBoardRemove } from './itemControl.js';
import { boardManager } from './board.js';
import { initControls } from './control.js';

const controlRoot = document.querySelector('.control');
const baseList = document.getElementById('items');
const listbox = document.querySelector('.listbox.items');
const spaceCounter = document.querySelector('.space-counter');

const raw = await fetch('./data/items.json').then(r => r.json());
const baseItems = loadItems(raw);

initControls(controlRoot, {
    baseItems,
    board: boardManager,
    onBoardChange: () => {}
});
populateList(baseList, baseItems);

buildBoardAdd(baseList, {
    baseItems,
    boardManager,
    listboxRoot: listbox,
    counterRoot: spaceCounter,
    maxSpace: 10
});

buildBoardRemove(listbox, { boardManager, counter: spaceCounter });

updateCounter(spaceCounter, boardManager.getCount());
