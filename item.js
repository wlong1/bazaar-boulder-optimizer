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
export const effType = Object.freeze({
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

export const targetType = Object.freeze({
    ENEMY: 10,
    SELF_HERO: 11,
    SELF_ITEM: 12,
    RANDOM: 13,
    LEFTMOST: 14,
    RIGHTMOST: 15
});


// Classes

export class Effect {
    constructor(type, value, target, pick = 1, source = null) {
        this.type = type;   // damage, shield, burn, etc
        this.value = value;
        this.target = target;
        this.pick = pick;   // for random i.e. haste (2) items, not multi
        this.source = source;
    }

    clone() {
        return new Effect(this.type, this.value, this.target, this.pick, this.source);
    }
    getValue() { return this.value; }
    setValue(val) { this.value = val; }
    getSource() { return this.source; }
    setSource(val) { this.source = val; }
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

export class Time {
    constructor(cooldown, clock) {
        this.cooldown = cooldown * 2;   // To avoid 0.5's, just let's double it
        this.clock = clock;
        this.haste = 0;
        this.slow = 0;
        this.freeze = 0;
    }

    addHaste(amount){   this.haste += amount*2; }
    addSlow(amount){    this.slow += amount*2; }
    addFreeze(amount){  this.freeze += amount*2; }
    addCharge(amount){  this.clock += amount*2; }

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
            this.freeze -= 1;
            gain = 0;
        }

        this.clock += gain;
        return (this.clock >= this.cooldown) && (this.freeze == 0);
    }

    clear() {
        this.clock = 0;
    }
}

export class Item {
    constructor({
        id = null,      // Item index
        name = '',
        usable = true,
        cooldown = 0,
        clock = 0,
        baseEffects = [],
        //scaleMods = [],
        itemTags = new Set(),
        typeTags = new Set(),
        size = null,
        multis = 1
    } = {}) {

    this.id = id;
    this.name = name;
    this.usable = usable;
    this.time = new Time(cooldown, clock);

    this.baseEffects = baseEffects;
    //this.scaleMods = scaleMods;    // fn to apply to base effects, never need to be removed
    this.flatMods = {};     // Flat modifiers i.e. { damage: +0, shield: -5 }
    this.postMods = {};     // fn to apply to extra effects, using dict for easy remove

    this.itemTags = itemTags;
    this.typeTags = typeTags;
    this.addedTags = new Set();
    this.size = size;
    this.multis = multis;
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
    getSize(){ return this.size; }
    getMultis(){ return this.multis; }
    getTags(){ return this.itemTags.union(this.typeTags); }

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
        Object.values(this.postMods).forEach(mod => mod(effects, this.flatMods));
        Object.values(effects).forEach(eff => eff.setSource(this.id));
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

