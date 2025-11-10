/*
Needs:

Index

Acceptable Rarity
Selected Rarity

On use Types

On use effect base
On use effect extra

Availbale enchants
Selected enchant

Base Modifiers
Extra Modifiers

Base Cooldown
Current ticks

Number of uses

===============================


On use:
Iterate through base + extra:
Apply relevant modifiers
Add to result

*/

// Enum
const effType = Object.freeze({
    // Applied to characters
    DAMAGE: 0,
    BURN: 1,
    POISON: 2,
    SHIELD: 3,
    HEAL: 4,
    REGEN: 5,
    // Applied to items
    TIME: 10,   // For reference
    HASTE: 11,
    SLOW: 12,
    FREEZE: 13,
    CHARGE: 14,
    FLY: 15
});

const targetType = Object.freeze({
    ENEMY: 0,
    SELF_HERO: 1,
    SELF_ITEM: 2,
    LEFT: 3,
    RIGHT: 4,
    ADJACENT: 5,
    RANDOM: 6,
    LEFTMOST: 7,
    RIGHTMOST: 8
});


// Classes

class Effect {
    constructor(type, value, target) {
        this.type = type;   // damage, shield, burn, etc
        this.value = value;
        this.target = target;
    }

    clone() { return new Effect(this.type, this.value, this.target); }
    getValue() { return this.value; }
    setValue(val) { this.value = val; }
    getType() { return this.type; }
    getTarget() { return this.target; }
    needsCompute() { return typeof this.value == "function"; }
}

/*
class Modifier {
    constructor(fn) {
        this.fn = fn;
    }

    apply(effect) { return this.fn(effect); }
}
*/

class Time {
    constructor(cooldown, clock) {
        this.cooldown = cooldown * 2;   // To avoid 0.5's, just let's double it
        this.clock = clock;
        this.haste = 0;
        this.slow = 0;
        this.freeze = 0;
    }

    addHaste(amount){ this.haste += amount*2; }
    addSlow(amount){ this.slow += amount*2; }
    addFreeze(amount){ this.freeze += amount*2; }
    addCharge(amount){ this.clock += amount*2; }

    pass() {
        let gain = 2;

        if (this.haste > 0){
            this.haste -= 1;
            gain *= 2;
        }
        if (this.slow > 0) {
            this.slow -= 1;
            gain /= 2;
        }
        if (this.freeze > 0){
            this.frozen -= 1;
            gain = 0;
        }

        this.clock += gain;
        return (this.clock >= this.cooldown) && (this.freeze == 0);
    }

    clear() {
        this.clock = 0;
    }
}

class Item {
    constructor({
        id = null,
        name = '',
        usable = true,
        cooldown = 0,
        clock = 0,
        baseEffects = [],
        scaleMods = [],
        tags = []
    } = {}) {

    this.id = id;
    this.name = name;
    this.usable = usable;
    this.time = new Time(cooldown, clock);

    this.baseEffects = baseEffects;
    //this.scaleMods = scaleMods;    // fn to apply to base effects, never need to be removed
    this.flatMods = {};     // Flat modifiers i.e. { damage: +0, shield: -5 }
    this.postMods = {};     // fn to apply to extra effects, using dict for easy remove

    this.tags = tags;
    };

    addFlatMod(type, mod){
        this.flatMods[type] = (this.flatMods[type] || 0) + mod;
    }
    removeFlatMod(type){
        delete this.flatMods[type];
    }
    addPostMod(key, mod){
        this.postMods[key] = mod;
    }
    removePostMod(key){
        delete this.postMods[key];
    }
    applyTime(type, amount){
        switch (type) {
            case effType.HASTE:
                this.time.addHaste(amount);
                break;
            case effType.SLOW:
                this.time.addSlow(amount);
                break;
            case effType.FREEZE:
                this.time.addFreeze(amount);
                break;
            case effType.CHARGE:
                this.time.addCharge(amount);
                break;
            default:
                console.log(`Error: applyTime with ${effType[type]} ${amount}`)
        }
    }

    computeEffects(context = {}){
        /*
        1. Calculate base value for effect
        2. Apply modifiers to it
        3. Compute dependent bonus effects
        4. Apply modifiers to bonus effects
        */
        const effects = {};
        this.baseEffects.forEach(base => {
            const eff = base.clone()
            const baseType = eff.getType();
            const baseValue = eff.needsCompute() ? eff.getValue()(context) : eff.getValue();
            const newValue = baseValue + (this.flatMods[baseType] ?? 0);

            eff.setValue(newValue);
            effects[baseType] = eff;
        })
        Object.values(this.postMods).forEach(m => m(effects, this.flatMods));
        return effects;
    }

    use(context) {
        console.log(`${this.name} used`)
        this.time.clear();
        return this.computeEffects(context);
    }

    tick(context) {
        if (!this.usable) {
            console.log(`${this.name} is unusable`)
            return null
        }
        if (this.time.pass()){
            return this.use(context);
        }
        console.log(`${this.name} is not ready`)
        return null;
    }

}


/* Test */
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
    type = "enchant",
    mod = (effects, flats) =>{
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