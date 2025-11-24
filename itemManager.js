import { effType, targetType } from "./item";
import { Heap } from 'https://cdn.jsdelivr.net/npm/heap-js@3.6.0/dist/heap.esm.js'


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
    if (k >= n) {
        const res = new Array(n);
        for (let i = 0; i < n; i++) res[i] = i;
            return res;
    }


    if (k <= (n >> 1)) {
        // Partial Fisher-Yates
        const res = new Array(n);
        for (let i = 0; i < n; i++) res[i] = i;

        for (let i = 0; i < k; i++) {
        const j = i + Math.floor(Math.random() * (n - i));
        const tmp = res[i];
        res[i] = res[j];
        res[j] = tmp;
        }

        return res.slice(0, k);
    } else {
        // Boolean-exclusion
        const m = n - k;
        const taken = new Array(n).fill(false);

        let cnt = 0;
        while (cnt < m) {
            const idx = Math.floor(Math.random() * n);
            if (!taken[idx]) {
                taken[idx] = true;
                cnt++;
            }
        }

        const result = new Array(k);
        let ri = 0;
        for (let i = 0; i < n && ri < k; i++) {
            if (!taken[i]) result[ri++] = i;
        }

        return result;
    }
}


function permutationApply(items, maxCapacity, fn) {
    if (items.length > 10) throw new Error(`Got ${items.length} items, expected <= 10`);
    if (maxCapacity > 10) throw new Error(`Got ${maxCapacity} maxCapacity, expected <= 10`);

    const ref = items.map(item => ({
        id: item.getId(),
        size: item.getSize(),
        symmetric: item.getSymmetric()
    }))
    ref.sort((a, b) => { return a.id - b.id });

    const n = ref.length;
    const sequence = [];
    let curSize = 0;
    let usedMask = 0;   // bitmask

    function validSequence(idSeq) {
        // Check for mirrors
        // We know if it is the mirrored version by comparing the ids
        // Can strictly enforce the valid version to be smaller id first
        const length = idSeq.length;
        for (let i = 0; i < length; i++) {
            const aId = ref[idSeq[i]].getId();
            const mirrorIndex = ref[length - 1 - i];
            const mirrorId = ref[mirrorIndex].getSymmetric();

            if (mirrorId === -1) return true;   // Can't be mirrored

            if (aId < mirrorId) return true;    // This sequence is prior
            if (mirrorId < aId) return false;
        }
        return true;    // Palindrome
    }

    function canExtend() {
        for (let i = 0; i < n; i++) {
            const bit = 1 << i;
            if (usedMask & bit) continue;

            if (i > 0 && !(usedMask & (1 << (i - 1))) && ref[i].getId() === ref[i - 1].getId()) {
                continue;
            }

            if (curSize + ref[i].size <= maxCapacity) {
                return true;
            }
        }
        return false;
    }

    function dfs() {
        if (sequence.length > 0 && validSequence(sequence) && !canExtend()){
            fn(sequence);
        }

        for (let i = 0; i < n; i++) {
            const bit = 1 << i;
            if (usedMask & bit) continue;
            if (i > 0 && !(usedMask & (1 << (i - 1)) && ref[i].getId() === ref[i-1].getId())){
                continue;
            }

            const size = ref[i].getSize();

            if (curSize + size > maxCapacity) continue;

            usedMask |= bit;
            sequence.push(i)
            curSize += size;

            dfs(fn);

            usedMask &= ~bit;
            sequence.pop();
            curSize -= size;
        }
    }

}


export function checkTypeTags(items, tag){
    return items.some(item => item.getTypeTags().has(tag));
}

export function checkItemTags(items, tag){
    return items.some(item => item.getItemTags().has(tag));
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
        this.context = context;
        this.listeners = [];

        this.reset();
    }

    reset(){
        this.listeners.length = 0;

        for (const item of this.items) {
            this.listeners.push(...item.getDynListeners());
            item.reset();
        }
        for (const listener of this.listeners){
            listener.reset();
        }
    }

    applyResult(effect){
        const type = effect.getType();
        const amount = effect.getAmount();
        const target = effect.getTarget();
        const pick = effect.getPick();
        const source = effect.getSource();

        let applied = true;

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
                    applied = this.items[source] !== undefined;
                    break;
                case targetType.RANDOM:
                    const arr = nChooseK(this.items, pick)
                    arr.forEach(index => this.items[index].applyTime(type, amount));
                    break;
                case targetType.LEFTMOST:
                    this.items[0].applyTime(type, amount);
                    applied = this.items[0] !== undefined;
                    break;
                case targetType.RIGHTMOST:
                    this.items[this.items.length - 1].applyTime(type, amount);
                    applied = this.items.length > 0;
                    break;
                case targetType.LEFT:
                    if (source - 1 >= 0){
                        this.items[source - 1]?.applyTime(type, amount);
                    } else {
                        applied = false;
                    }
                    break;
                case targetType.RIGHT:
                    if (source + 1 < this.items.length){
                        this.items[source + 1]?.applyTime(type, amount);
                    } else {
                        applied = false;
                    }
                    break;
            }
        }

        return applied;
    }

    checkDyn(effect){
        const res = [];
        const stillActive = [];

        for (const listener of this.listeners) {
            const eff = listener.check(effect, this.items, effect.getSource());

            if (eff != -1) {
                stillActive.push(listener);

                if (eff != null) {
                    if (Array.isArray(eff)) {
                        res.push(...eff);
                    } else {
                        res.push(eff);
                    }
                }
            }
        }

        this.listeners = stillActive;
        return res;
    }

    calculate(topK = 5){
        const bestResults = new Heap((a, b) => b[0] - a[0]);    // maxHeap
        const worstResults = new Heap((a, b) => a[0] - b[0]);   // minHeap

        permutationApply(this.items, maxCapacity, (sequence) => {
            const [time, data] = simulate(sequence);
            
            if (bestResults.size() < topK) {
                bestResults.push([time, data]);
            } else if (time < bestResults.peek()[0]) {
                bestResults.pop();
                bestResults.push([time, data]);
            }
            
            if (worstResults.size() < topK) {
                worstResults.push([time, data]);
            } else if (time > worstResults.peek()[0]) {
                worstResults.pop();
                worstResults.push([time, data]);
            }
        });
        
        return {
            top: bestResults.toArray().sort((a, b) => a[0] - b[0]),
            bot: worstResults.toArray().sort((a, b) => a[0] - b[0])
        };
    }

    simulate(sequence){
        const itemList = sequence.map(index => this.items[index]);
        const itemHistory = [];
        const sandstorm = 30*10;
        let effList = [];
        let results = null;
        let victory = false;
        let time = 0


        for (const item of itemList){
            item.checkStatic(this.context, itemList);
        }
        
        while (time <= this.limit && !victory){
            time += 1;

            for (const item of itemList){
                results = item.tick(this.context);
                if (results) {
                    for (const result of results){
                        if (this.applyResult(result)) {
                            itemHistory.push([time, result])

                            effList.push(result);
                            while (effList.length){
                                const eff = effList.pop();
                                const dynList = this.checkDyn(eff);
                                if (Array.isArray(dynList) && dynList.length > 0) {
                                    for (const dynEff of dynList) effList.push(dynEff);
                                }
                            }
                        }
                    }
                }
            }


            if (time > sandstorm){
                this.context.damage(time - sandstorm);
            }

            victory = this.context.tick(time);
        }
        
        this.reset();
        return [time, itemHistory];
    }

}