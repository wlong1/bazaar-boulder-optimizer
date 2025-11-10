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

// Enums
const speed = Object.freeze({
    HASTE: 0,
    SLOW: 1,
    FREEZE: 2,
    CHARGE: 3
});


// Classes

class Effect {
    constructor(type, value) {
        this.type = type;   // damage, shield, burn, etc
        this.value = value;
        this.extra = {};    // Effect scaling off of primary
    }

    clone() {
        return new Effect(this.type, this.value);
    }
}

class Modifier {
    constructor(id, fn, type) {
        this.id = id;
        this.fn = fn;
        this.type = type;   // Stack types together
    }

    apply(effect) {
        return this.fn(effect);
    }
}

class Time {
    constructor(cooldown, clock) {
        this.cooldown = cooldown * 2;   // To avoid 0.5's, just let's double it
        this.clock = clock;
        this.haste = 0;
        this.slow = 0;
        this.freeze = 0;
    }

    addHaste(amount){ this.haste += amount*2; }
    addSlow(amount){ this.haste += amount*2; }
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
        if (this.frozen){
            this.frozen -= 1;
            gain = 0;
        }

        this.clock += gain;

        return (this.clock >= this.cooldown) && (this.freeze == 0);
    }

    clear() {
        this.clock = 0;
        this.ready = false;
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
        scaleMods = []
    } = {}) {

    this.id = id;
    this.name = name;
    this.usable = usable;
    this.time = new Time(cooldown, clock);

    this.baseEffects = baseEffects;
    this.scaleMods = scaleMods;    // fn to apply to base effects, never need to be removed
    this.flatMods = {};     // Flat modifiers i.e. { damage: +0, shield: -5 }
    this.postMods = {};     // fn to apply to extra effects, using dict for easy remove
    };

    addMod(key, mod){
        this.flatMods[key] = (this.flatMods[key] || 0) + mod;
    }
    removeMod(key){
        delete this.flatMods[key];
    }
    addPost(type, mod){
        this.postMods[type] = mod;
    }
    removePost(key){
        delete this.postMods[key];
    }
    applyTime(type, amount){
        switch (type) {
            case speed.HASTE:
                this.time.addHaste(amount);
            case speed.SLOW:
                this.time.addSlow(amount);
            case speed.FREEZE:
                this.time.addFreeze(amount);
            case speed.CHARGE:
                this.time.addCharge(amount);
            default:
                console.log(`Error: applyTime with ${type} ${amount}`)
        }
    }

    computeEffects(context = {}){
        /*
        1. Calculate base value for effect
        2. Apply modifiers to it
        3. Calculate extra effects
        4. Apply modifiers to bonus effects
        */
        return this.baseEffects.map(base => {
            let eff = base.clone();

            eff.value = typeof eff.value == 'function' ? eff.value(context) : eff.value;
            eff = this.scaleMods.reduce((acc, m) => m.apply(acc), eff);
            eff.value += this.flatMods[eff.type] || 0;
            eff = Object.values(this.postMods).reduce((acc, m) => m.apply(acc), eff);

            return eff;
        })
    }

    use(context) {
        this.time.clear();
        return this.computeEffects(context);
    }

    tick(context) {
        if (this.usable && this.time.pass()){
            return this.use(context);
        }
        return null;
    }

}
