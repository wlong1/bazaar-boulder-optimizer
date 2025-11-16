import { Item } from "./item";
import { Manager } from "./itemManager";

let enemyHP = 10000;
let context = {
    enemyHP: enemyHP
}

let boulder = new Item({
    id: 0, 
    name: 'Boulder',
    usable: true,
    cooldown: 20*10,
    clock: 0,
    baseEffects: [new Effect(
        effType.DAMAGE,
        context => context.enemyHP,
        targetType.ENEMY
    )]
})


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
            const base = effects[effType.DAMAGE];
            const newValue = Math.round(base.getValue() * 0.05) + (flats[effType.BURN] ?? 0);
            effects[effType.BURN] = new Effect (
                effType.BURN,
                newValue,
                targetType.ENEMY
            )
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
    let items = [boulder];
    let manager = new Manager({
        items: items
    });

    manager.simulate(context);
}

testManager();