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

class Effect {
    constructor(type, value) {
        this.type = type;   // Damage, Shield, Burn, etc
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

class Item {
    constructor({
        name,
        baseEffects = []     
    } = {}) {

    this.id = id;
    this.name = name;
    this.baseEffects = baseEffects;
    this.modifiers = {};    // { damage: +0, shield: -5 }
    this.postMods = [];     // list of fn to apply to base effects
    };
}