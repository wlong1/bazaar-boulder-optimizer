import { effType, Effect, Item, Listener, tagType, itemType, modType } from "./item";
import { Context, Manager, checkItemTags, checkTypeTags } from "./itemManager";

let enemyHP = 10000;
let context = new Context({enemyHp: enemyHP})

let boulder = new Item({
    id: 0, 
    name: 'Boulder',
    usable: true,
    cooldown: 20*5,
    clock: 0,
    baseEffects: [new Effect({
        type: effType.DAMAGE,
        amount: context => context.enemyHp,
        target: targetType.ENEMY}
    )],
    size: 3,
    typeTags: [tagType.WEAPON, tagType.RELIC]
})

let captainsWheel = new Item({
    id: 1, 
    name: "Captain's Wheel",
    usable: true,
    cooldown: 5*5,
    clock: 0,
    baseEffects: [
        new Effect({
        type: effType.HASTE,
        amount: 3*10,
        target: targetType.LEFT}),
        new Effect({
        type: effType.HASTE,
        amount: 3*10,
        target: targetType.RIGHT}
    )],
    staticListeners: [
        new Listener({
            condition: (_, items, _2) => {
                checkTypeTags(tagType.VEHICLE) || checkItemTags(itemType.LARGE)
            },
            effect: (_, items, source) => {
                items[source].addTimeMod(modType.PERCENT, 0.5)
            }
        })
    ],
    size: 2,
    typeTags: [tagType.AQUATIC, tagType.TOOL]
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

/*  Boulder + No Passive Captain's Wheel Expected:
5s - CW procs
Boulder = 15 - 5 = 10
10 - CW procs
Boulder = 5 - 5, rest is hasted, average is 2.5s
Expected: 12.5 s for proc
*/

function testManager(){
    let items = [boulder, captainsWheel];
    let manager = new Manager({
        items: items,
        context: context
    });

    const res = manager.simulate();
    console.log(res);
}

testManager();