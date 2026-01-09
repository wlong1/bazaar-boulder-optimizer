import { initControls } from './control.js';
import { populateList } from './itemControl.js'

const itemData = await fetch("./data/items.json").then(r => r.json());

initControls(document.querySelector('.control'));

const itemsListSel = document.getElementById('items');
populateList(itemsListSel, itemData);