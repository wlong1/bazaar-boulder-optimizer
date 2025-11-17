import { effType, targetType } from "./item";


export class Context {
    constructor({
        enemyHp = 10000,
        enemyShield = 0,
        selfHp = 10000,
        selfShield = 0
    } = {}){
        this.enemyHp = enemyHp;
        this.enemyShield = enemyShield;
        this.selfHpMax = selfHp;
        this.selfHpCur = selfHp;
        this.selfShield = selfShield;
        this.selfRegen = 0;
        this.enemyBurn = 0;
        this.enemyPoison = 0;
    }

    damage(amount){
        this.enemyHp -= Math.max(0, amount - this.enemyShield);
        this.enemyShield = Math.max(0, this.enemyShield - amount);
    }

    addEnemyBurn(amount){ this.enemyBurn += amount; }
    addEnemyPoison(amount){ this.enemyPoison += amount; }
    addSelfShield(amount){ this.selfShield += amount; }
    addSelfRegen(amount){ this.selfRegen += amount; }
    addSelfHeal(amount){ this.selfHpCur = Math.min(this.selfHpCur + amount, this.selfHpMax); }

    tick(time){
        // Burn applies twice a second
        // Poison applies once per second
        // 10 ticks per second
        if (this.enemyBurn > 0 && time % 5 == 0){
            // Burn deals half when shield exists
            if (this.enemyShield > 0){
                this.damage(Math.floor(this.enemyBurn/2));
            } else {
                this.enemyHp -= Math.floor(this.enemyBurn/2);
            }
            this.enemyBurn -= 1;
        }

        if (this.enemyPoison && time % 10 == 0){
            this.enemyHp -= this.enemyPoison;
        }

        return this.enemyHp <= 0;
    }
}


const effectHeroMap = {
    [targetType.SELF_HERO]: {
        [effType.DAMAGE]: (context, amount) => context.damage(amount),
        [effType.REGEN]: (context, amount) => context.addSelfRegen(amount),
        [effType.HEAL]: (context, amount) => context.addSelfHeal(amount)
    },
    [targetType.ENEMY]: {
        [effType.DAMAGE]: (context, amount) => context.damage(amount),
        [effType.BURN]: (context, amount) => context.addEnemyBurn(amount),
        [effType.POISON]: (context, amount) => context.addEnemyPoison(amount)
    }
};


function nChooseK(arr, k) {
    const n = arr.length;
    
    if (k <= 0) return [];
    if (k >= n) return Array.from({ length: n }, (_, i) => i);

    const exclude = k > n / 2;
    const targetCount = exclude ? n - k : k;
    
    const taken = new Array(n).fill(false);
    let count = 0;
    
    while (count < targetCount) {
        const idx = Math.floor(Math.random() * n);
        if (!taken[idx]) {
            taken[idx] = true;
            count++;
        }
    }
    
    const result = [];
    if (exclude) {
        for (let i = 0; i < n; i++) {
            if (!taken[i]) result.push(i);
        }
    } else {
        for (let i = 0; i < n; i++) {
            if (taken[i]) result.push(i);
        }
    }
    
    return result;
}


export class Manager {
    constructor({
        items = [],
        slots = {},
        limit = 20*10,
        context = new Context()
    } = {}){
        this.items = items;
        this.slots = slots;
        this.limit = limit;
        this.time = 1;
        this.context = context;
    }

    applyResult(effect){
        const type = effect.getType();
        const amount = effect.getAmount();
        const target = effect.getTarget();
        const pick = effect.getPick();
        const source = effect.getSource();

        /*
        ENEMY: 10,
        SELF_HERO: 11,
        SELF_ITEM: 12,
        RANDOM: 13,
        LEFTMOST: 14,
        RIGHTMOST: 15,
        LEFT: 16,
        RIGHT: 17
        */
        if (target <= targetType.SELF_HERO ){ // SELF_HERO is 11, ENEMY is 10
            effectHeroMap[target][type](this.context, amount)
        } else {
            switch (target) {
                case targetType.SELF_ITEM:
                    this.items[source].applyTime(type, amount);
                    break;
                case targetType.RANDOM:
                    const arr = nChooseK(this.items, pick)
                    arr.forEach(index => this.items[index].applyTime(type, amount));
                    break;
                case targetType.LEFTMOST:
                    this.items[0].applyTime(type, amount);
                    break;
                case targetType.RIGHTMOST:
                    this.items[this.items.length - 1].applyTime(type, amount);
                    break;
                case targetType.LEFT:
                    if (source - 1 >= 0){
                        this.items[source - 1]?.applyTime(type, amount);
                    }
                    break;
                case targetType.RIGHT:
                    if (source + 1 < this.items.length){
                        this.items[source + 1]?.applyTime(type, amount);
                    }
                    break;
            }
        }
    }

    simulate(){
        const itemUses = [];
        const sandstorm = 30*10;
        let victory = false;
        
        while (this.time <= this.limit && !victory){

            for (const item of this.items){
                let results = item.tick(this.context)
                if (results) {
                    for (const result of results){
                        this.applyResult(result);
                        itemUses.push([this.time, result])
                    }
                }
            }

            if (this.time > sandstorm){
                this.context.damage(this.time - sandstorm);
            }

            victory = this.context.tick(this.time);
            this.time += 1;
        }
        return [this.time, itemUses];
    }

}