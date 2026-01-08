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

    const top_sequence = res.top[0][1];
    console.log(`Running top sequence ${JSON.stringify(seqToNames(top_sequence, items))}`);
    res = manager.run_sim(top_sequence, 100, true);
    console.log(res);

    const tiebreaker_seq = [1, 3, 2, 0, 4];
    console.log(`Running sequence ${JSON.stringify(seqToNames(tiebreaker_seq, items))}`);
    
    runs = 50000;
    console.log(`${runs} runs:`)
    res = manager.run_sim(tiebreaker_seq, runs, true);
    console.log(res);

}

testManager();