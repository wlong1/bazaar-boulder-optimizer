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
    FLY: 15,
});

export const targetType = Object.freeze({
    ENEMY: 10,
    SELF_HERO: 11,
    SELF_ITEM: 12,
    RANDOM: 13,
    LEFTMOST: 14,
    RIGHTMOST: 15,
    LEFT: 16,
    RIGHT: 17
});

export const modType = Object.freeze({
    FLAT: 0,
    PERCENT: 1
})

export const tagType = Object.freeze({
    APPAREL: 0,
    AQUATIC: 1,
    CORE: 2,
    DINOSAUR: 3,
    DRAGON: 4,
    DRONE: 5,
    FOOD: 6,
    FRIEND: 7,
    LOOT: 8,
    POTION: 9,
    PROPERTY: 10,
    RAY: 11,
    REAGENT: 12,
    RELIC: 13,
    TECH: 14,
    TOOL: 15,
    TOY: 16,
    VEHICLE: 17,
    WEAPON: 18
});

export const itemType = Object.freeze({
    SMALL: 20,
    MEDIUM: 21,
    LARGE: 22,
    AMMO: 23,
    LIFESTEAL: 24,
    QUEST: 25
})


// Classes

export class Effect {
    constructor({type, amount, target, pick = 1, source = null}={}) {
        this.type = type;   // damage, shield, burn, etc
        this.amount = amount;
        this.target = target;
        this.pick = pick;   // for random i.e. haste (2) items, not multi
        this.source = source;
    }

    clone(){
        return new Effect({
            type: this.type,
            amount: this.amount,
            target: this.target,
            pick: this.pick,
            source: this.source
        })};

    getAmount(){ return this.amount; }
    setAmount(amount){ this.amount = amount; }
    getSource(){ return this.source; }
    setSource(index){ this.source = index; }
    getType(){ return this.type; }
    getTarget(){ return this.target; }
    getPick(){ return this.pick; }
    needsCompute(){ return typeof this.amount == "function"; }

    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `Effect(type=${this.type}, amount=${this.amount}, pick=${this.pick}, target=${this.target}, source=${this.source})`;
    }
}


export class Listener {
    constructor({condition, effect, limit = Infinity} = {}){
        this.condition = condition;
        this.effect = effect;
        this.limit = limit;
        this.count = 0;
    }

    reset(){ this.count = 0; }

    check(context, effect, items, source){
        if (this.count >= this.limit){
            return -1
        }
        if (this.condition(context, effect, items, source)){
            let procs = 1;
            if (effect != null) {
                console.log(effect);
                procs = Math.min(effect.getPick(), this.limit - this.count);
            }
            this.count += procs;
            return Array(procs).fill(this.effect(context, effect, items, source));
        }
        return null;
    }
}


export class Time {
    // Cooldowns are marked in increments of 0.1s (10 per second)
    // Internal cooldowns are 0.2s (5 ticks per second)
    constructor(baseCooldown, clock, mods = []) {
        this.multiplier = 2;
        this.tickPerPass = 1;
        this.baseCooldown = baseCooldown * this.multiplier;   // To avoid 0.5's, just let's double it
        this.mods = mods;   // array of [type, value] mods
        this.cooldown = 0;
        this.clock = clock;
        this.haste = 0;
        this.slow = 0;
        this.freeze = 0;

        this.updateTime();
    }

    addHaste(amount){   this.haste += amount; }
    addSlow(amount){    this.slow += amount; }
    addFreeze(amount){  this.freeze += amount; }
    addCharge(amount){  this.clock += amount; }

    updateTime(){
        let cooldown = this.baseCooldown;
        for (const mod of this.mods) {
            const type = mod[0];
            const value = mod[1];
            if (type === modType.FLAT){
                cooldown += value;
            } else {
                cooldown *= value;
            }
        }
        this.cooldown = Math.floor(cooldown);
    }

    addMod(type, value){
        this.mods.push([type, value]);
        this.updateTime();
    }

    removeMod(type, value){
        const index = this.mods.findIndex(
            (mod) => mod[0] === type && mod[1] === value
        );

        if (index !== -1) {
            this.mods.splice(index, 1);
            this.updateTime();
        }
    }

    pass(){
        let gain = 1 * this.multiplier * this.tickPerPass;

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

    clear(){
        this.clock = 0;
        this.haste = 0;
        this.slow = 0;
        this.freeze = 0;
    }
}


export class Item {
    constructor({
        id = null,      // Item index
        name = '',
        usable = true,
        symmetric = true,
        cooldown = 0,
        clock = 0,
        baseEffects = [],
        //scaleMods = [],
        itemTags = new Set(),
        typeTags = new Set(),
        staticListeners = [],
        dynListeners = [],
        size = 1,
        random = 0,
        multis = 1
    } = {}) {

    this.id = id;
    this.name = name;
    this.symmetric = symmetric ? id : -1;
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
    this.random = random;

    this.multis = multis;
    this.queue = []
    this.justUsed = false;

    this.staticListeners = staticListeners;
    this.dynListeners = dynListeners;

    this.addSizeTag();
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
    
    setId(id){ this.id = id; }
    getId(){ return this.id; }
    getSymmetric(){ return this.symmetric; }
    getSize(){ return this.size; }
    getMultis(){ return this.multis; }
    getTags(){ return new Set([...this.itemTags, ...this.typeTags]); }
    getItemTags(){ return this.itemTags; }
    getTypeTags(){ return this.typeTags; }
    getDynListeners(){ return this.dynListeners; }

    addSizeTag(){
        switch (this.size){
            case 1:
                this.itemTags.add(itemType.SMALL);
                break;
            case 2:
                this.itemTags.add(itemType.MEDIUM);
                break;
            default:
                this.itemTags.add(itemType.LARGE);
                break;
        }
    }

    addTimeMod(type, value){
        this.time.addMod(type, value);
    }

    removeTimeMod(type, value){
        this.time.removeMod(type, value);
    }

    checkStatic(context, items){
        for (const listener of this.staticListeners) {
            listener.check(context, null, items, this.id);
        }
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

    reset(){
        this.time.clear();
        this.queue.length = 0;
    }

    computeEffects(context = {}){
        /*
        1. Calculate base amount for effect
        2. Apply modifiers to it
        3. Compute dependent bonus effects
        4. Apply modifiers to bonus effects

        Scaling effects should always be based off of the first element
        */
        const effects = [];
        this.baseEffects.forEach(base => {
            const eff = base.clone()
            const baseType = eff.getType();
            const baseAmount = eff.needsCompute() ? eff.getAmount()(context) : eff.getAmount();
            const newAmount = baseAmount + (this.flatMods[baseType] ?? 0);

            eff.setAmount(newAmount);
            effects.push(eff);
        })
        Object.values(this.postMods).forEach(mod => mod(effects, this.flatMods));
        effects.forEach(eff => eff.setSource(this.id));
        return effects;
    }

    use(context){
        console.log(`${this.name} used`)
        this.time.clear();
        const res = this.computeEffects(context);
        if (res) { this.queue.push(res); }
    }

    tick(context){
        if (!this.usable) {
            // console.log(`${this.name} is unusable`)
            return null
        }

        if (this.time.pass()){ this.use(context); }
        if (this.queue.length > 0){
            if (this.justUsed){
                this.justUsed = false;
                return null;
            } else {
                this.justUsed = true;
                return this.queue.pop()
            }
        }
        // console.log(`${this.name} is not ready`)
        return null;
    }

}

