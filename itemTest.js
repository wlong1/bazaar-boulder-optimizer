import { effType, Effect, Item } from "./item";
import { Context, Manager } from "./itemManager";

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
    )]
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
        amount: 3,
        target: targetType.LEFT}),
        new Effect({
        type: effType.HASTE,
        amount: 3,
        target: targetType.RIGHT}
    )]
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

function testManager(){
    let items = [boulder, captainsWheel];
    let manager = new Manager({
        items: items,
        context: context
    });

    res = manager.simulate();
    console.log(res);
}

testManager();