import { effType, Effect, Item, Listener, tagType, itemType, modType } from "./item";
import { Context, Manager, checkItemTags, checkTypeTags, countUniqueTags } from "./itemManager";

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
2.5s - CW procs
Boulder = 20 - 1 = 19
5s - CW procs
Boulder = 19 - 1 = 18
7.5s - CW procs
Boulder = 17
10, boulder = 16
12.5, boulder = 15
15, boulder procs
*/

function testManager(){
    let items = [boulder, captainsWheel, rowboat];
    let manager = new Manager({
        items: items,
        context: context
    });


    let res = manager.simulate([1,0,2]);
    console.log(res);

    res = manager.simulate([1,0,2]);
    console.log(res);

    res = manager.calculate();
    console.log('top: [');
    res.top.forEach(([time, seq]) => console.log(`  [${time}, [${seq.join(', ')}]],`));
    console.log(']');
    console.log('bot: [');
    res.bot.forEach(([time, seq]) => console.log(`  [${time}, [${seq.join(', ')}]],`));
    console.log(']');
}

testManager();