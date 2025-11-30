import { effType, Effect, Item, Listener, targetType, tagType, itemType, modType } from "./item.js";
import { Context, Manager, checkItemTags, checkTypeTags, countUniqueTags } from "./itemManager.js";


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

let boulder = new Item({
    id: 0, 
    name: 'Boulder',
    usable: true,
    cooldown: 20*10,
    clock: 0,
    baseEffects: [new Effect({
        type: effType.DAMAGE,
        amount: context => context.enemyHp,
        target: targetType.ENEMY}
    )],
    size: 3,
    typeTags: new Set([tagType.WEAPON, tagType.RELIC])
})

let captainsWheel = new Item({
    id: 1, 
    name: "Captain's Wheel",
    usable: true,
    cooldown: 5*10,
    clock: 0,
    baseEffects: [
        new Effect({
        type: effType.HASTE,
        amount: 1*10,
        target: targetType.LEFT}),
        new Effect({
        type: effType.HASTE,
        amount: 1*10,
        target: targetType.RIGHT}
    )],
    staticListeners: [
        new Listener({
            condition: (context, effect, items, source) => {
                return checkTypeTags(items, tagType.VEHICLE) || checkItemTags(items, itemType.LARGE)
            },
            effect: (context, effect, items, source) => {
                items[source].addTimeMod(modType.PERCENT, 0.5)
            }
        })
    ],
    size: 2,
    typeTags: new Set([tagType.AQUATIC, tagType.TOOL])
})


let rowboat = new Item({
    id: 2, 
    name: "Rowboat",
    usable: true,
    cooldown: 8*10,
    clock: 0,
    baseEffects: [
        new Effect({
        type: effType.CHARGE,
        amount: 1*10,
        target: targetType.LEFT}),
        new Effect({
        type: effType.CHARGE,
        amount: 1*10,
        target: targetType.RIGHT}
    )],
    staticListeners: [
        new Listener({
            condition: (context, effect, items, source) => {
                return countUniqueTags(items) >= 5;
            },
            effect: (context, effect, items, source) => {
                items[source].addTimeMod(modType.FLAT, -5*10)
            }
        })
    ],
    size: 2,
    typeTags: new Set([tagType.AQUATIC, tagType.VEHICLE])
})

let starChart = new Item({
    id: 3, 
    name: 'Star Chart',
    usable: false,
    clock: 0,
    staticListeners: [
        new Listener({
            condition: (context, effect, items, source) => true,
            effect: (context, effect, items, source) => {
                items[source - 1]?.addTimeMod(modType.PERCENT, 0.8);
                items[source + 1]?.addTimeMod(modType.PERCENT, 0.8);
            }
        })
    ],
    size: 2,
    typeTags: new Set([tagType.RELIC, tagType.TOOL])
})

let diveWeights = new Item({
    id: 4, 
    name: 'Dive Weights',
    usable: true,
    ammo: 4,
    random: 1,
    cooldown: 8*10,
    clock: 0,
    baseEffects: [
        new Effect({
        type: effType.HASTE,
        amount: 1*10,
        target: targetType.RANDOM})
    ],
    staticListeners: [
        new Listener({
            condition: (context, effect, items, source) => {
                return items[source - 1]?.getTypeTags().has(tagType.AQUATIC);
            },
            effect: (context, effect, items, source) => {
                items[source]?.addTimeMod(modType.FLAT, -1*10);
            }
        }),
        new Listener({
            condition: (context, effect, items, source) => {
                return items[source + 1]?.getTypeTags().has(tagType.AQUATIC);
            },
            effect: (context, effect, items, source) => {
                items[source]?.addTimeMod(modType.FLAT, -1*10);
            }
        }),
        new Listener({
            condition: (context, effect, items, source) => true
            ,
            effect:(context, effect, items, source) => {
                items[source].setMulti(1 + items[source].getAmmo());
            }
        })
    ],
    size: 1,
    typeTags: new Set([tagType.APPAREL, tagType.AQUATIC, tagType.TOOL])
})

diveWeights.addDynListener(new Listener({
    condition: (context, effect, items, source) => {
        return items[source].getId() === diveWeights.id
    },
    effect:(context, effect, items, source) => {
        items[source].setMulti(1 + items[source].getAmmo());
    }
}));



function effFind(effects, type){
    return effects.find(e => e.getType() === type);
}

function testItem(){
    let result;
    result = boulder.tick(context);
    console.log(result);

    boulder.applyTime(effType.CHARGE, 20*10);
    result = boulder.tick(context);
    console.log(result);

    result = boulder.tick(context);
    console.log(result);

    // Enchant
    console.log("Enchant:");
    boulder.addPostMod(
        "enchant",
        (effects, flats) =>{
            const base = effFind(effects, effType.BURN);
            const newValue = Math.round(base.getAmount() * 0.05) + (flats[effType.BURN] ?? 0);
            effects.push(new Effect (
                effType.BURN,
                newValue,
                targetType.ENEMY
            ))
        }
    )

    result = boulder.use(context);
    console.log(result);

    // Flat mods
    console.log("Flats:");
    boulder.addFlatMod(
        effType.BURN,
        3
    )

    boulder.addFlatMod(
        effType.DAMAGE,
        20
    )

    /*      Expected:
    10000 + 20 = 10020 damage
    10020 * 0.05 = 501
    501 + 3 = 504 burn
    */

    result = boulder.use(context);
    console.log(result);

}

/*  Captain's Wheel + Boulder + Rowboat:
2.5s - CW procs; Boulder = 20 - 1 = 19
3s - Rowboat procs; Boulder = 18
5s - CW procs; Boulder = 18 - 1 = 17
6s - Rowboat; Boulder = 16
7.5s - CW procs; Boulder = 15
9s - Rowboat; Boulder = 14
10s - CW; Boulder = 13
12s - Rowboat; Boulder = 12
Boulder triggers on tick after


Boulder, CW, RB:
25 CW,
26 RB hasted 26
27 - 28; 28 - 30, RB Ready, fires at 28, 0
29 - 2; 30 - 4; 31 - 6; 32 - 8; 34 - 10; 35 - 12; 36 - 14 Haste is over
40 CW, RB Expected: 40 - 35 = 5, 5 + 14 = 19 RB
41 - 21; 42 - 23; 43 - 25; 44 - 27; 45 - 29; 46 - 31; RB fires at 46
Looks OK
*/

function testManager(){
    let items = [boulder, diveWeights, rowboat, starChart, captainsWheel];
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

    saveData(res, runs);
}

testManager();