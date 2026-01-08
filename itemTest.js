import { effType, Effect, targetType } from "./item.js";
import { Context, Manager } from "./itemManager.js";
import { loadItems } from "./itemFactory.js";


function seqToNames(seq, items) {
    const idMap = new Map(items.map((item, index) => [index, item.getName()]));
    return seq.map(id => idMap.get(id));;
}

function saveData(data, runs){
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `runs${runs}.json`;
    a.click();
    URL.revokeObjectURL(url);
}


let enemyHP = 10000;
let context = new Context({enemyHp: enemyHP})

const itemData = await fetch("./data/items.json").then(r => r.json());

let items = loadItems(itemData);


function testManager(){
    let manager = new Manager({
        items: items,
        context: context
    });


    let res = 0;
    let runs = 100;

    res = manager.calculate(10, 10, 1000);

    console.log(`Number of total sequences: ${res.total}`);

    console.log('Top sequences:');
    res.top.forEach(([time, seq]) => {
        const names = seqToNames(seq, items);
        console.log(`  [${time}, ${JSON.stringify(names)}]`)
    });

    console.log('Bot sequences:');
    res.bot.forEach(([time, seq]) => {
        const names = seqToNames(seq, items);
        console.log(`  [${time}, ${JSON.stringify(names)}]`)
    });

    const top_sequence = [4, 1, 0, 2, 3];
    const top_names = seqToNames(top_sequence, items);
    console.log(`\nRunning top sequence: [${top_names.join(', ')}]`);
    let historyRuns = manager.run_sim(top_sequence, 1, false, true);
    let history = historyRuns[0];
    console.log('Item history:');
    history.forEach(([t, effect]) => {
        console.log(`  t=${t}: type=${effect.getType()}, amount=${effect.getAmount()}, target=${effect.getTarget()}, source=${effect.getSource()}`);
    });

    const bot_sequence = res.bot[0][1];
    const bot_names = seqToNames(bot_sequence, items);
    console.log(`\nRunning bot sequence: [${bot_names.join(', ')}]`);
    historyRuns = manager.run_sim(bot_sequence, 1, false, true);
    history = historyRuns[0];
    console.log('Item history:');
    history.forEach(([t, effect]) => {
        console.log(`  t=${t}: type=${effect.getType()}, amount=${effect.getAmount()}, target=${effect.getTarget()}, source=${effect.getSource()}`);
    });
}

testManager();